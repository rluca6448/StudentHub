import { supabase } from '../../services/supabaseClient.js';

const fetchBenefits = async (req, res) => {
    const { universityId } = req.params;

  try {
    const { data: universityBenefits, error: universityBenefitsError } = await supabase
      .from('universitybenefit')
      .select('benefit_id')
      .eq('university_id', universityId);

    if (universityBenefitsError) throw universityBenefitsError;

    const benefitIds = universityBenefits.map(b => b.benefit_id);

    const { data: filteredBenefits, error: filteredBenefitsError } = await supabase
      .from('benefit')
      .select('id, name')
      .in('id', benefitIds);

    if (filteredBenefitsError) throw filteredBenefitsError;

    const { data: imageData, error: imageError } = await supabase
      .from('imagebenefit')
      .select('benefit_id, image_id')
      .in('benefit_id', filteredBenefits.map(b => b.id));

    if (imageError) throw imageError;

    const imageIds = imageData.map(ib => ib.image_id);

    const { data: imagesData, error: imagesError } = await supabase
      .from('image')
      .select('id, base64image')
      .in('id', imageIds);

    if (imagesError) throw imagesError;

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

    res.status(200).json(benefitsWithImages);  // Retornamos los beneficios en formato JSON
  } catch (error) {
    console.error('Error fetching benefits:', error);
    res.status(500).json({ message: 'Error fetching benefits' });
  }
};

export { fetchBenefits };
