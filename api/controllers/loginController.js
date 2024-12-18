import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

import { supabase } from "../services/supabaseClient.js";

const RESEND_KEY = "re_PSDw7XEW_BmSZ4m8WMPGH6kPryFssRy9R";

const checkUsername = async (req, res) => {
	const { username } = req.params;

	try {
		const { data, error } = await supabase
			.from("appuser")
			.select("username")
			.eq("username", username)
			.single();

		if (error) {
			// Si ocurre un error en la consulta, podría significar que el nombre es único
			return res.json({ isTaken: false });
		}

		if (data) {
			// Si el nombre de usuario ya existe en la base de datos
			return res.json({ isTaken: true });
		}
	} catch (error) {
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

const checkEmail = async (req, res) => {
	const { fullMail } = req.params;

	try {
		const { data, error } = await supabase
			.from("mail")
			.select("Mail")
			.eq("Mail", fullMail)
			.single();

		if (error) {
			// Si ocurre un error en la consulta, podría significar que el nombre es único
			return res.json({ isTaken: false });
		}

		if (data) {
			// Si el nombre de usuario ya existe en la base de datos
			return res.json({ isTaken: true });
		}
	} catch (error) {
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

const registerUser = async (req, res) => {
	const { username, password, fullMail } = req.body;

	if (!username || !password || !fullMail) {
		return res
			.status(400)
			.json({ message: "Username, password and email are required" });
	}

	try {
		// Verificar si el nombre de usuario ya existe
		const { data: user, error: user_error } = await supabase
			.from("appuser")
			.select("username")
			.eq("username", username)
			.single();

		const { data: testmail, error: testmail_error } = await supabase
			.from("mail")
			.select("Mail")
			.eq("Mail", fullMail)
			.single();

		if (user) {
			return res.status(400).json({ message: "Username is already taken" });
		}

		if (testmail) {
			return res.status(400).json({ message: "Email is already taken" });
		}

		// Si el nombre de usuario es único, procede con el registro
		const hashedPassword = await bcrypt.hash(password, 10);
		const { error: insertError } = await supabase
			.from("appuser")
			.insert({ username: username, password_hash: hashedPassword });

		if (insertError) {
			return res.status(500).json({ message: "Error creating user" });
		}

		const emailVerificationToken = jwt.sign({ fullMail }, "secretKey", {
			expiresIn: "1h",
		});

		const { data: data_user_id, error: error_data_user_id } = await supabase
			.from("appuser")
			.select("user_id")
			.eq("username", username)
			.single();

		if (error_data_user_id) throw error_data_user_id;

		const us_id = data_user_id.user_id;

		const index = fullMail.indexOf("@");

		if (index == -1) {
			throw new Error("Formato mail invalido");
		}

		const domain = fullMail.slice(index);

		const { data: data_university_id, error: error_data_university_id } =
			await supabase
				.from("university")
				.select("university_id")
				.eq("domain", domain)
				.single();

		if (error_data_university_id) throw error_data_university_id;

		const uni_id = data_university_id.university_id;

		const { error: insertMailError } = await supabase.from("mail").insert({
			Mail: fullMail,
			university_id: uni_id,
			user_id: us_id,
			is_primary: true,
		});

		if (insertMailError) {
			console.error(insertMailError);
			return res.status(500).json({ message: "Error inserting email" });
		}

		await sendVerificationEmail(fullMail, emailVerificationToken);

		res.status(200).json({ message: "User registered successfully" });
	} catch (error) {
		res.status(500).json({ message: "Internal Server Error" });
	}
};

const validateLogin = async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res
				.status(400)
				.json({ message: "Username and password are required" });
		}

		const { data: users, data: user_error } = await supabase
			.from("appuser")
			.select("*")
			.eq("username", username)
			.single();

		//const user = users.find(u => u.username === username);

		if (!users.username) {
			return res.status(400).json({ message: "Usuario incorrecta" });
		}

		// Comparar la contraseña con el hash almacenado
		const isPasswordValid = await bcrypt.compare(password, users.password_hash);

		if (!isPasswordValid) {
			return res.status(400).json({ message: "Contraseña incorrecta" });
		}

		console.log(users.user_id);

		const { data: is_validated, error: is_validated_error } =
			await supabase.rpc("get_is_user_verified", {
				user_id_arg: users.user_id,
			});

		if (is_validated_error) throw is_validated_error;

		if (!is_validated[0].is_user_verified) {
			return res.status(400).json({ message: "Mail aun no validado" });
		}

		// Generar un token JWT con información del usuario
		const token = jwt.sign(
			{ id: users.user_id, username: users.username, is_admin: users.is_admin },
			"secretKey"
		);
		res.cookie("token", token, {
			httpOnly: true, // Evita que la cookie sea accedida mediante JavaScript
			secure: true, // Asegura que la cookie solo sea enviada por HTTPS
			sameSite: "none", // Previene el envío de la cookie en solicitudes de origen cruzado
			maxAge: 7 * 24 * 60 * 60 * 1000, // Expira en 1 día (milisegundos)
		});

		// Enviar el token al cliente
		res.status(200).json({ token });
	} catch (error) {
		return res.status(400).json({ message: "Error en el inicio de sesion" });
	}
};

async function sendVerificationEmail(email, token) {
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${RESEND_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: "noreply@studenthubweb.me",
			to: email,
			subject: "Verifica tu correo electrónico",
			html: `
          <p>Gracias por registrarte. Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
          <a href="https://studenthubweb.me/Verified/${token}">Verificar correo</a>
        `,
		}),
	});

	if (!response.ok) {
		console.error("Error al enviar el correo de verificación");
	}
}

async function sendPasswordResetEmail(email, token) {
	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${RESEND_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: "noreply@studenthubweb.me",
			to: email,
			subject: "Cambiar contraseña",
			html: `
          <p>Este es un mail para pedir un cambio de contraseña. Haz click en restaurar contraseña para dirigirte a la página y efectuar el cambio:</p>
          <a href="http://localhost:3000/ResetPassword/${token}">Restaurar Contraseña</a> 
        ` /* TODO: cambiar a https://studenthubweb.me */,
		}),
	});

	if (!response.ok) {
		console.error("Error al enviar el correo de verificación");
	}
}

const resetPassword = async (req, res) => {
	const { fullMail } = req.body;

	const passwordResetToken = jwt.sign({ fullMail }, "secretKey", {
		expiresIn: "1h",
	});

	await sendPasswordResetEmail(fullMail, passwordResetToken);

	res.status(200).json({ message: "Password reset email sent" });
};

const validateEmail = async (req, res) => {
	//const token = req.query.token;
	const { token } = req.params;

	try {
		const decoded = jwt.verify(token, "secretKey");

		const { data: email, error: fetchError } = await supabase
			.from("mail") // Tabla en Supabase donde están los usuarios
			.select("*")
			.eq("Mail", decoded.fullMail)
			.single();

		if (fetchError) {
			// Error al buscar el mail
			return res
				.status(400)
				.json({ message: "Usuario no encontrado o error en la búsqueda" });
		}

		if (!email) {
			// Si el mail no fue encontrado
			return res.status(404).json({ message: "Mail no encontrado" });
		}

		if (email.is_verified) {
			return res.status(200).json({ message: "El correo ya está verificado" });
		}

		const { error: updateError } = await supabase
			.from("mail")
			.update({ is_verified: true })
			.eq("Mail", email.Mail);

		if (updateError) {
			return res
				.status(500)
				.json({ message: "Error actualizando el estado de verificación" });
		}

		res.status(200).json({ message: "Correo verificado con éxito" });
	} catch (err) {
		if (err.name === "TokenExpiredError") {
			return res.status(400).json({ message: "El token ha expirado" });
		}
		if (err.name === "JsonWebTokenError") {
			return res.status(400).json({ message: "Token inválido" });
		}

		return res
			.status(400)
			.json({ message: "Error en la verificación del token" });
	}
};

const checkToken = async (req, res) => {
	const { token } = req.body;

	if (token) {
		try {
			const decoded = jwt.verify(token, "secretKey");

			return res.json({ isAvailable: true });
		} catch {
			if (err.name === "TokenExpiredError") {
				return res.status(400).json({ message: "El token ha expirado" });
			}
			if (err.name === "JsonWebTokenError") {
				return res.status(400).json({ message: "Token inválido" });
			}

			return res
				.status(400)
				.json({ message: "Error en la verificación del token" });
		}
	} else {
		return res.json({ isAvailable: false });
	}
};

const changePassword = async (req, res) => {
	const { password, token } = req.body;

	const decoded = jwt.verify(token, "secretKey");
	const hashedPassword = await bcrypt.hash(password, 10);

	const { data: userId, error: userIdError } = await supabase
		.from("mail")
		.select("user_id")
		.single()
		.eq("Mail", decoded.fullMail);

	if (userIdError) {
		return res.status(500).json({ message: "Error getting user id" });
	}

	const { data: updatedPassword, error: updatedPasswordError } = await supabase
		.from("appuser")
		.update({ password_hash: hashedPassword })
		.eq("user_id", userId.user_id);

	if (updatedPasswordError) {
		return res.status(500).json({ message: "Error updating user password" });
	}

	res.status(200).json({ message: "Password updated successfully" });
};

const comparePasswords = async (req, res) => {
	const { plainPassword, hashedPassword } = req.body; // cambie nombre de password a plainPassword

	if (!plainPassword || !hashedPassword) {
		// cambie nombre de password a plainPassword
		return res
			.status(400)
			.json({ message: "Both password and hash are required" });
	}

	try {
		const isValid = await bcrypt.compare(plainPassword, hashedPassword); // cambie nombre de password a plainPassword
		res.status(200).json({ isValid });
	} catch (error) {
		res.status(500).json({ message: "Error comparing passwords" });
	}
};

const hashPassword = async (req, res) => {
	const { password } = req.body;

	if (!password) {
		return res.status(400).json({ message: "Password is required" });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		res.status(200).json({ hashedPassword });
	} catch (error) {
		res.status(500).json({ message: "Error hashing password" });
	}
};

export {
	checkUsername,
	checkEmail,
	registerUser,
	validateLogin,
	validateEmail,
	checkToken,
	sendVerificationEmail,
	resetPassword,
	changePassword,
	hashPassword,
	comparePasswords,
};
