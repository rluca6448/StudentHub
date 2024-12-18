import { supabase } from '../services/supabaseClient.js';

const fetchCategories = async (req, res) => {
    try {
      
      const { universityId } = req.params;

      if(!universityId || universityId == null) {
        return req.status(400).json({ message: 'universityId is required' });
      }
      
      const { data: universityBenefits, error: universityBenefitsError } = await supabase
        .from("universitybenefit")
        .select("benefit_id")
        .eq("university_id", universityId);

      if (universityBenefitsError) throw universityBenefitsError;

      const benefitIds = universityBenefits.map(b => b.benefit_id);

      const { data: categories, error: categoriesError } = await supabase
        .from("benefit")
        .select("category_id")
        .in("id", benefitIds);

      if (categoriesError) throw categoriesError;

      const categoryIds = categories.map(c => c.category_id);

      const { data: categoryNames, error: categoryNamesError } = await supabase
        .from("category")
        .select("name, icon")
        .in("id", categoryIds);

      if (categoryNamesError) throw categoryNamesError;

      if (categoryNames.length === 0) {
        return res.status(404).json({ message: 'Categories not found' });
      }

      const iconIds = categoryNames.map(category => category.icon);
    
      const { data: icons, error: iconsError } = await supabase
        .from("image")  
        .select("id, base64image")
        .in("id", iconIds);

      if (iconsError) throw iconsError;


      const categoriesWithImages = categoryNames.map(category => {
        // Busca el ícono correspondiente en la lista de íconos, filtrando por el ID
        const matchedIcon = icons.find(icon => icon.id === category.icon);
    
        // Retorna un array donde el primer valor es el nombre de la categoría y el segundo la imagen en base64
        return {
          name: category.name,
          base64image: matchedIcon ? matchedIcon.base64image : null // Si no encuentra el ícono, asigna null
        };
      });

      if (categoriesWithImages.length == 0) {
        res.status(404).json({ message: 'Categories not found' });
      }

      res.status(200).json(categoriesWithImages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };



  const fetchFeaturedImages = async (req, res) => {
    try {
      
      const { universityId } = req.params;

      if(!universityId) {
        return req.status(400).json({ message: 'universityId is required' });
      }

      const { data: featuredBenefit, error: featuredBenefitError } = await supabase
        .from("featured_benefits")
        .select("benefit_id")
        .eq("university_id", universityId);

      if (featuredBenefitError) throw featuredBenefitError;

      const featuredBenefitIds = featuredBenefit.map(b => b.benefit_id);

      const { data: imageBenefits, error: imageBenefitsError } = await supabase
        .from("imagebenefit")
        .select("image_id")
        .in("benefit_id", featuredBenefitIds);

      if (imageBenefitsError) throw imageBenefitsError;

      const imageIds = imageBenefits.map(b => b.image_id);

      const { data: images, error: imagesError } = await supabase
        .from("image")
        .select("base64image")
        .in("id", imageIds);

      if (imagesError) throw imagesError;

      if (images.length === 0) {
        return res.status(404).json({ message: 'Categories not found' });
      }

      res.status(200).json(images.map(item => item.base64image));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


  const fetchBenefitsByCategory = async (req, res) => {

    try {

      const { universityId, category } = req.params;

      if(!universityId || !category) {
        return req.status(400).json({ message: 'universityId and category name is required' });
      }
      // Obtener el ID de la categoría a partir del nombre de la categoría seleccionada
      const { data: categoryData, error: categoryError } = await supabase
        .from('category')
        .select('id')
        .eq('name', category)
        .single();

      if (categoryError) throw categoryError;
      const categoryId = categoryData.id;

      // Obtener los IDs de los beneficios asociados a la universidad
      const { data: universityBenefits, error: universityBenefitsError } = await supabase
        .from('universitybenefit')
        .select('benefit_id')
        .eq('university_id', universityId);

      if (universityBenefitsError) throw universityBenefitsError;

      const benefitIds = universityBenefits.map(b => b.benefit_id);

      // Filtrar los beneficios por categoría y por universidad
      const { data: filteredBenefits, error: filteredBenefitsError } = await supabase
        .from('benefit')
        .select('id, name')
        .in('id', benefitIds) // Filtra por los IDs obtenidos
        .eq('category_id', categoryId); // Filtra por categoría

      if (filteredBenefitsError) throw filteredBenefitsError;

      // Obtener las imágenes asociadas a los beneficios filtrados
      const { data: imageData, error: imageError } = await supabase
        .from('imagebenefit')
        .select('benefit_id, image_id')
        .in('benefit_id', filteredBenefits.map(b => b.id)); // Usar los IDs filtrados

      if (imageError) throw imageError;

      const imageIds = imageData.map(ib => ib.image_id);

      // Obtener los datos de las imágenes
      const { data: imagesData, error: imagesError } = await supabase
        .from('image')
        .select('id, base64image')
        .in('id', imageIds);

      if (imagesError) throw imagesError;

      // Asignar los beneficios con sus respectivas imágenes
      const benefitsWithImages = filteredBenefits.map(benefit => {
        const benefitImages = imageData
          .filter(ib => ib.benefit_id === benefit.id)
          .map(ib => imagesData.find(img => img.id === ib.image_id).base64image);

        return {
          id: benefit.id,
          name: benefit.name,
          images: benefitImages
        };
      });

      if (benefitsWithImages.length === 0) {
        return res.status(404).json({ message: 'Benefits not found' });
      }

      res.status(200).json(benefitsWithImages);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


  //module.exports = {fetchCategories, fetchFeaturedImages, fetchBenefitsByCategory};

  export { fetchCategories, fetchFeaturedImages, fetchBenefitsByCategory };