import { supabase } from "../services/supabaseClient.js";
import jwt from "jsonwebtoken";

const check_admin = async (req, res) => {
	//const token = req.cookies.token;
	const { token } = req.body;
	console.log("Token " + token);

	if (token) {
		try {
			const decoded = jwt.verify(token, "secretKey");

			return res.json({ isAdmin: decoded.is_admin });
		} catch (error) {
			console.log(error.name + " " + error.message);
			if (error.name === "TokenExpiredError") {
				return res.status(400).json({ message: "El token ha expirado" });
			}
			if (error.name === "JsonWebTokenError") {
				return res.status(400).json({ message: "Token inválido" });
			}
			res.status(500).json({ message: error.message });
		}
	} else {
		return res.status(500).json({ message: "Cookie no encontrada" });
	}
};

const getUsername = async (req, res) => {
	const { userId } = req.params;

	try {
		const { data: username, error: error } = await supabase
			.from("appuser")
			.select("username")
			.eq("user_id", userId);

		if (error) {
			console.error("Supabase error: ", error);
			return res.status(500).json({ message: "Error getting the username" });
		}

		return res
			.status(200)
			.json({ message: "Username fetched successfully", data: username });
	} catch (error) {
		console.error("Catch block error: ", error);
		return res.status(500).json({ message: "Error getting the username" });
	}
};

const getUserInfo = async (req, res) => {
	const { userId } = req.params;

	try {
		const { data, error } = await supabase.rpc("get_user_info", {
			user_id_arg: userId,
		});

		if (error) {
			console.error("Supabase error: ", error);
			return res.status(500).json({ message: "Error getting the user" });
		}

		return res
			.status(200)
			.json({ message: "User info fetched successfully", data: data });
	} catch (error) {
		console.error("Catch block error: ", error);
		return res.status(500).json({ message: "Error getting the user" });
	}
};

const getUserLodgments = async (req, res) => {
	//const userId = jwt.verify(req.cookies.token, "secretKey");

    const { token } = req.body;

    

	try {

        const decoded = jwt.verify(token, "secretKey");
        const userId = decoded.id

		const { data, error } = await supabase.rpc(
			"get_all_hospedaje_with_images",
			{
				user_id_arg: userId,
			}
		);

		if (error) {
			console.error("Supabase error: ", error);
			return res.status(500).json({ message: "Error getting the lodgments" });
		}

		return res
			.status(200)
			.json({ message: "Lodgments fetched successfully", data: data });
	} catch (error) {
		console.error("Catch block error: ", error);
		return res.status(500).json({ message: "Error getting the lodgments" });
	}
};

const check_user_id = async (req, res) => {
	const { token } = req.body;

	if (token) {
		try {
			const decoded = jwt.verify(token, "secretKey");

			return res.json({ userId: decoded.id });
		} catch (error) {
			console.log(error.name + " " + error.message);
			if (error.name === "TokenExpiredError") {
				return res.status(400).json({ message: "El token ha expirado" });
			}
			if (error.name === "JsonWebTokenError") {
				return res.status(400).json({ message: "Token inválido" });
			}
			res.status(500).json({ message: error.message });
		}
	} else {
		return res.status(500).json({ message: "Cookie no encontrada" });
	}
};

const getUserUniversities = async (req, res) => {
	const userId = jwt.verify(req.cookies.token, "secretKey");

	try {
		const { data, error } = await supabase.rpc("get_user_universities", {
			user_id_arg: userId.id,
		});

		if (error) {
			console.error("Supabase error: ", error);
			return res
				.status(500)
				.json({ message: "Error getting the universities" });
		}

		return res
			.status(200)
			.json({ message: "Universities fetched successfully", data: data });
	} catch (error) {
		console.error("Catch block error: ", error);
		return res.status(500).json({ message: "Error getting the universities" });
	}
};

export {
	check_admin,
	getUsername,
	check_user_id,
	getUserLodgments,
	getUserInfo,
	getUserUniversities,
};
