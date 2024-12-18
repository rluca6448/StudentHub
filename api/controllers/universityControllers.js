import { supabase } from '../services/supabaseClient.js';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from './loginController.js';

const fetchDomains = async (req, res) => {
  try {
    const { data: domainsData, error: domainsError } = await supabase
      .from("university")
      .select("domain");

    if (domainsError) throw domainsError;

    const domains = domainsData.map((b) => b.domain);

    if (domains.length === 0) {
      return res.status(404).json({ message: "Domains not found" });
    }

    res.status(200).json(domains);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fetchUniversities = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "token is required" });
    }

    const decoded = jwt.verify(token, "secretKey");
    console.log("University " + decoded);

    const { data: universitiesData, error: universitiesError } = await supabase
      .from("mail")
      .select("university_id", "is_primary")
      .eq("user_id", decoded.id)
      .eq("is_verified", true)
      .single();

    if (universitiesError) throw universitiesError;

    if (universitiesData.length === 0) {
      return res.status(404).json({ message: "Universities not found" });
    }

    console.log(universitiesData.university_id);

    res.status(200).json(universitiesData.university_id);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fetchCoordinates = async (req, res) => {
  try {

    const { universityId } = req.params;

      if(!universityId) {
        return req.status(400).json({ message: 'universityId is required' });
      }

    const { data: coordinatesData, error: coordinatesError } = await supabase
      .from("university")
      .select("latitud, longitud")
      .eq("university_id", universityId)
      .single();

    if (coordinatesError) throw coordinatesError;

    res.status(200).json(coordinatesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }


};

const addMail = async (req, res) => {
  try {
    const { Mail, university_id, user_id, is_primary, is_verified } = req.body;

    // Verificar si el correo ya existe
    const { data: existingMail, error: checkError } = await supabase
      .from("mail")
      .select("Mail")
      .eq("Mail", Mail)
      .single();

    if (existingMail) {
      return res.status(400).json({ message: "El correo ya está registrado." });
    }

    if (!Mail || !university_id || !user_id) {
      return res.status(400).json({ message: "mail, university_id, and user_id are required" });
    }

    // Insertar el correo en la tabla "mail"
    const { data, error } = await supabase
      .from("mail")
      .insert([{ Mail, university_id, user_id, is_primary, is_verified }]);

      if (error) {
        return res.status(500).json({ message: "Error al agregar el correo." });
      }

    // Generar y enviar el correo de verificación
    const token = jwt.sign({ fullMail: Mail }, "secretKey", { expiresIn: "1h" });
    await sendVerificationEmail(Mail, token);

    res.status(200).json({ message: "Correo agregado y verificación enviada." });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getUniversityByDomain = async (req, res) => {
  try {
    const { universityDomain } = req.params;

    console.log(universityDomain)

    const { data: universityData, error: universityError } = await supabase
      .from("university")
      .select("university_id, name")
      .eq("domain", "@" + universityDomain)
      .single();

    console.log(universityData)
    
    if (universityError) throw universityError;

    if (!universityData) {
      return res.status(404).json({ message: "University not found" });
    }
    
    res.status(200).json(universityData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export { fetchDomains, fetchUniversities, fetchCoordinates, addMail, getUniversityByDomain };
