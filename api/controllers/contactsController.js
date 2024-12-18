import { supabase } from '../services/supabaseClient.js';

const fetchContactsByUniversity = async (req, res) => {
  try {
    const { universityId, activeUserId } = req.params;

    if (!universityId || universityId == null || !activeUserId || activeUserId == null) {
      return res.status(400).json({ message: 'universityId and activeUserId are required' });
    }

    // Paso 1: Obtener contactos por universidad excluyendo el usuario activo
    const { data: contactsByUniversity, error: contactsByUniversityError } = await supabase
      .from("mail")
      .select("Mail, university_id, user_id")
      .eq("university_id", universityId)
      .neq("user_id", activeUserId);

    if (contactsByUniversityError) throw contactsByUniversityError;

    // Paso 2: Obtener todos los user_id únicos de los contactos obtenidos
    const userIds = contactsByUniversity.map(contact => contact.user_id);

    // Paso 3: Obtener datos de `appuser` basados en los user_id recuperados
    const { data: users, error: usersError } = await supabase
      .from("appuser")
      .select("user_id, username, profile_picture")
      .in("user_id", userIds);

    if (usersError) throw usersError;

    // Paso 4: Obtener IDs de imágenes únicos de `profile_picture`
    const profilePictureIds = users.map(user => user.profile_picture).filter(Boolean);

    const { data: images, error: imagesError } = await supabase
      .from("image")
      .select("id, base64image")
      .in("id", profilePictureIds);

    if (imagesError) throw imagesError;

    // Paso 5: Combinar los datos de imágenes con los usuarios
    const usersWithImages = users.map(user => {
      const image = images.find(img => img.id === user.profile_picture);
      return {
        ...user,
        profile_picture: image ? image.base64image : null, // Base64 de la imagen o null si no existe
      };
    });

    // obtengo el nombre de la universidad
    const { data: university, error: universityError } = await supabase
            .from("university")
            .select("name")
            .eq("university_id", universityId)
            .single(); // Queremos solo un registro

        if (universityError) throw universityError;

    // Paso 6: Combinar los datos de `mail` con los usuarios enriquecidos
    const combinedData = contactsByUniversity.map(contact => {
      const user = usersWithImages.find(u => u.user_id === contact.user_id);
      return {
        ...contact,
        username: user ? user.username : null,
        profile_picture: user ? user.profile_picture : null,
        university_name: university.name
      };
    });

    if (combinedData.length === 0) {
      return res.status(404).json({ message: "Contacts not found" });
    }

    res.status(200).json(combinedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const fetchAllUniversities = async (req, res) => {
    try {
        const { universityId } = req.params;

        if (!universityId || universityId == null) {
            return res.status(400).json({ message: 'universityId is required' });
        }

        // Consulta para obtener todas las universidades excepto la especificada
        const { data: universities, error } = await supabase
            .from("university")
            .select("university_id, name")
            .neq("university_id", universityId);

        if (error) throw error;

        if (universities.length === 0) {
            return res.status(404).json({ message: "No universities found" });
        }

        res.status(200).json(universities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const fetchMyUniversity = async (req, res) => {
  try {
      const { universityId } = req.params;

      if (!universityId || universityId == null) {
          return res.status(400).json({ message: 'universityId is required' });
      }

      // Consulta para obtener todas las universidades excepto la especificada
      const { data: universities, error } = await supabase
          .from("university")
          .select("university_id, name")
          .eq("university_id", universityId);

      if (error) throw error;

      if (universities.length === 0) {
          return res.status(404).json({ message: "No universities found" });
      }

      res.status(200).json(universities);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

export { fetchContactsByUniversity, fetchAllUniversities, fetchMyUniversity };
