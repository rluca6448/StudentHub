import { supabase } from "../services/supabaseClient.js";
import { calculateDistance } from "../functions/distances.js";
import jwt from "jsonwebtoken";

// Función para buscar hospedajes cercanos
const fetchNearbyLodgings = async (req, res) => {
	const { lat, lon, radius } = req.params;

	if (!lat || !lon || !radius) {
		return req
			.status(400)
			.json({ message: "latitud, longitud and radius is required" });
	}

	try {
		// 1. Obtener todos los hospedajes
		const { data: hospedajes, error: hospedajesError } = await supabase
			.from("hospedaje")
			.select("id, name, brief_description, latitud, longitud, user_id");

		if (hospedajesError) throw hospedajesError;

		// 2. Filtrar hospedajes dentro del radio usando la función de cálculo de distancia
		/* TODO: Aca no seria mejor aprovechar lo que vimos de base de datos? Es mejor aprovechar la potencia
			de procesamiento del servidor, que es mucho mas rapido que el host de la pagina, capaz se puede cambiar
			por un where en la parte de arriba */
		const nearbyLodgings = hospedajes.filter((hospedaje) => {
			const distance = calculateDistance(
				lat,
				lon,
				hospedaje.latitud,
				hospedaje.longitud
			);
			return distance <= radius;
		});

		// 3. Obtener las imágenes de cada hospedaje y el nombre del usuario
		const hospedajesConImagenes = await Promise.all(
			nearbyLodgings.map(async (hospedaje) => {
				const { data: images, error: imagesError } = await supabase
					.from("hospedaje_images")
					.select("image(base64image)")
					.eq("hospedaje_id", hospedaje.id);

				if (imagesError) throw imagesError;

				// Obtener el nombre de usuario
				const { data: userData, error: userError } = await supabase
					.from("appuser")
					.select("username, profile_picture")
					.eq("user_id", hospedaje.user_id)
					.single();

				if (userError) throw userError;

				const { data: userImage, error: userImageError } = await supabase
					.from("image")
					.select("base64image")
					.eq("id", userData.profile_picture)
					.single();

				if (userImageError) throw userImageError;

				// Si hay imágenes, agregarlas al hospedaje
				return {
					...hospedaje,
					images: images.map((img) => img.image.base64image),
					username: userData.username,
					profile_picture: userImage.base64image,
				};
			})
		);

		const return_value = hospedajesConImagenes;

		if (return_value.length === 0) {
			return res.status(404).json({ message: "Lodgement not found" });
		}

		res.status(200).json(return_value);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const storeLodge = async (req, res) => {
	const {
		title,
		briefDescription,
		value,
		latitude,
		longitude,
		fileList,
		token,
	} = req.body;

	const userId = jwt.verify(token, "secretKey");

	if (
		!title ||
		!briefDescription ||
		!value ||
		!latitude ||
		!longitude ||
		fileList.length == 0
	) {
		return res.status(500).json({ message: "Some field is missing!" });
	}

	try {
		const { data: lodgeData, error: insertError } = await supabase
			.from("hospedaje")
			.insert({
				name: title,
				user_id: userId.id,
				latitud: latitude,
				longitud: longitude,
				brief_description: briefDescription,
				long_description: value,
			})
			.select("id");

		if (insertError) {
			return res.status(500).json({ message: "Error registering a lodge" });
		}

		const lodgeId = lodgeData[0].id;

		const { data: lodgeImagesData, error: insertImagesError } = await supabase
			.from("image")
			.insert(
				fileList.map((picture) => ({
					base64image: picture.url, // TODO: cambiar base64image por url en todos los archivos
					name: title,
				}))
			)
			.select("id");

		if (insertImagesError) {
			return res.status(500).json({ message: "Error storing the images" });
		}

		const insertedImageIds = lodgeImagesData.map((image) => image.id);

		const { data: lodgeLinkData, error: insertLinkError } = await supabase
			.from("hospedaje_images")
			.insert(
				insertedImageIds.map((imageId) => ({
					hospedaje_id: lodgeId,
					image_id: imageId,
				}))
			);

		if (insertLinkError) {
			return res.status(500).json({ message: "Error storing the images" });
		}

		return res
			.status(200)
			.json({ message: "Lodge and images registered successfully" });
	} catch (e) {
		return res.status(500).json({ message: "Error registering a lodge" });
	}
};

const deleteLodge = async (req, res) => {
	const { postId } = req.params;
	const userId = jwt.verify(req.cookies.token, "secretKey").id;

	try {
		const { data, error: userError } = await supabase.rpc("get_user_info", {
			user_id_arg: userId,
		});

		if (userError) {
			return res.status(500).json({ message: "Error getting the user" });
		}

		const { data: hasData, error: hasDataError } = await supabase
			.from("hospedaje")
			.select("*")
			.eq("id", postId)
			.eq("user_id", userId);

		if (data[0].is_admin === true || hasData.length === 0) {
			const { data: imagesId, error: imagesIdError } = await supabase
				.from("hospedaje_images")
				.select("image_id")
				.eq("hospedaje_id", postId);

			const { data: imagesUrl, error: imagesUrlError } = await supabase
				.from("image")
				.select("base64image")
				.in(
					"id",
					imagesId.map((image) => image.image_id)
				);

			if (imagesUrlError || imagesIdError) {
				return res
					.status(500)
					.json({ message: "Error finding related images", data: false });
			}

			const { data: result, error: error } = await supabase
				.from("hospedaje")
				.delete()
				.eq("id", postId)
				.eq("user_id", userId);

			if (error) {
				return res
					.status(500)
					.json({ message: "Error deleting a lodge", data: false });
			}

			if (imagesId.length > 0) {
				const { data: deletedImages, error: deleteImagesError } = await supabase
					.from("image")
					.delete()
					.in(
						"id",
						imagesId.map((image) => image.image_id)
					);

				if (deleteImagesError) {
					return res
						.status(500)
						.json({ message: "Error deleting the images", data: false });
				}

				imagesUrl.forEach(async (url) => {
					const match = url.base64image.match(/[^/]+$/);
					await supabase.storage
						.from("lodgment_images")
						.remove([match ? decodeURIComponent(match[0]) : null]);
				});
			}

			return res
				.status(200)
				.json({ message: "Lodge deleted successfully", data: true });
		} else {
			return res
				.status(401)
				.json({ message: "You are not authorized to delete this lodge" });
		}
	} catch (e) {
		return res
			.status(500)
			.json({ message: "Error deleting the lodge", data: false });
	}
};

const getLodgeById = async (req, res) => {
	const { postId } = req.params;

	try {
		const { data: lodgeData, error: error } = await supabase
			.from("hospedaje")
			.select("*")
			.eq("id", postId);

		if (error) {
			return res.status(500).json({ message: "Error getting a lodge" });
		}

		return res.status(200).json({
			message: "Lodge description fetched successfully",
			data: lodgeData,
		});
	} catch (e) {
		return res.status(500).json({ message: "Error getting the lodge" });
	}
};

export { fetchNearbyLodgings, storeLodge, getLodgeById, deleteLodge };
