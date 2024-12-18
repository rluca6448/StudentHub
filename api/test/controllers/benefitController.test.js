import { expect } from 'chai';
import sinon from 'sinon';
import { supabase } from '../../services/supabaseClient.js'; 
import { fetchCategories, fetchFeaturedImages, fetchBenefitsByCategory } from '../../controllers/benefitController.js';

describe('fetchCategories', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { universityId: 'some-university-id' } };
    res = { 
      status: sinon.stub().returnsThis(), 
      json: sinon.spy() 
    };
  });

  afterEach(() => {
    sinon.restore(); // Restaurar los stubs después de cada test
  });

  it('should return 400 if universityId is not provided', async () => {
    req.params.universityId = null; // No se proporciona universityId

    await fetchCategories(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'universityId is required' })).to.be.true;
  });

  it('should return 404 if no categories are found', async () => {
    sinon.stub(supabase, 'from').returns({
      select: sinon.stub().returnsThis(),
      eq: sinon.stub().returnsThis(),
      in: sinon.stub().returns({ data: [] }), // Simula que no se encuentran categorías
    });

    await fetchCategories(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Categories not found' })).to.be.true;
  });

  it('should return 200 with categories and icons', async () => {
    // Stub para universitybenefit
    sinon.stub(supabase, 'from')
      .onFirstCall().returns({
        select: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({
          data: [{ benefit_id: 'benefit-1' }, { benefit_id: 'benefit-2' }]
        }),
      })
      // Stub para benefit
      .onSecondCall().returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({
          data: [{ category_id: 'category-1' }, { category_id: 'category-2' }]
        }),
      })
      // Stub para category
      .onThirdCall().returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({
          data: [{ name: 'Category 1', icon: 'icon-1' }, { name: 'Category 2', icon: 'icon-2' }]
        }),
      })
      // Stub para image
      .onCall(3).returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({
          data: [{ id: 'icon-1', base64image: 'image-1' }, { id: 'icon-2', base64image: 'image-2' }]
        }),
      });

    await fetchCategories(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith([
      { name: 'Category 1', base64image: 'image-1' },
      { name: 'Category 2', base64image: 'image-2' }
    ])).to.be.true;
  });

  it('should handle errors and return 500', async () => {
    sinon.stub(supabase, 'from').throws(new Error('Database error'));

    await fetchCategories(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
  });
});

describe('fetchFeaturedImages', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { universityId: 'some-university-id' } };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
  });

  afterEach(() => {
    sinon.restore(); // Restaurar los stubs después de cada test
  });

  it('should return 400 if universityId is not provided', async () => {
    req.params.universityId = null; // No se proporciona universityId

    await fetchFeaturedImages(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'universityId is required' })).to.be.true;
  });

  it('should return 404 if no images are found', async () => {
    // Stub para featured_benefits
    sinon.stub(supabase, 'from')
      .onFirstCall().returns({
        select: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({ data: [{ benefit_id: 'benefit-1' }] })
      })
      // Stub para imagebenefit
      .onSecondCall().returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({ data: [{ image_id: 'image-1' }] })
      })
      // Stub para image
      .onThirdCall().returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({ data: [] }) // Simulando que no se encuentran imágenes
      });

    await fetchFeaturedImages(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Categories not found' })).to.be.true;
  });

  it('should return 200 with the list of images', async () => {
    // Stub para featured_benefits
    sinon.stub(supabase, 'from')
      .onFirstCall().returns({
        select: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({ data: [{ benefit_id: 'benefit-1' }, { benefit_id: 'benefit-2' }] })
      })
      // Stub para imagebenefit
      .onSecondCall().returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({ data: [{ image_id: 'image-1' }, { image_id: 'image-2' }] })
      })
      // Stub para image
      .onThirdCall().returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({ data: [{ base64image: 'image1' }, { base64image: 'image2' }] })
      });

    await fetchFeaturedImages(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(['image1', 'image2'])).to.be.true;
  });

  it('should handle errors and return 500', async () => {
    sinon.stub(supabase, 'from').throws(new Error('Database error'));

    await fetchFeaturedImages(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
  });
});


describe('fetchBenefitsByCategory', () => {
  let req, res;

  beforeEach(() => {
    req = { params: { universityId: 'some-university-id', category: 'some-category' } };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
  });

  afterEach(() => {
    sinon.restore(); // Restaurar los stubs después de cada test
  });

  it('should return 400 if universityId or category is not provided', async () => {
    req.params.universityId = null; // Sin universityId

    await fetchBenefitsByCategory(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'universityId and category name is required' })).to.be.true;
  });

  it('should return 404 if no benefits are found', async () => {
    // Stub para category
    sinon.stub(supabase, 'from')
      .onFirstCall().returns({
        select: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({ data: { id: 'category-1' } }) // Retorna ID de categoría
      })
      // Stub para universitybenefit
      .onSecondCall().returns({
        select: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({ data: [{ benefit_id: 'benefit-1' }] }) // Retorna beneficios asociados
      })
      // Stub para benefit
      .onThirdCall().returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({ data: [] }) // No se encuentran beneficios para la categoría
      });

    await fetchBenefitsByCategory(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Benefits not found' })).to.be.true;
  });

  it('should return 200 with the list of benefits and their images', async () => {
    // Stub para category
    sinon.stub(supabase, 'from')
      .onFirstCall().returns({
        select: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({ data: { id: 'category-1' } }) // Retorna ID de categoría
      })
      // Stub para universitybenefit
      .onSecondCall().returns({
        select: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({ data: [{ benefit_id: 'benefit-1' }, { benefit_id: 'benefit-2' }] }) // Beneficios asociados
      })
      // Stub para benefit
      .onThirdCall().returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returnsThis(),
        eq: sinon.stub().returns({
          data: [{ id: 'benefit-1', name: 'Benefit 1' }, { id: 'benefit-2', name: 'Benefit 2' }]
        })
      })
      // Stub para imagebenefit
      .onCall(3).returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({
          data: [{ benefit_id: 'benefit-1', image_id: 'image-1' }, { benefit_id: 'benefit-2', image_id: 'image-2' }]
        })
      })
      // Stub para image
      .onCall(4).returns({
        select: sinon.stub().returnsThis(),
        in: sinon.stub().returns({
          data: [{ id: 'image-1', base64image: 'base64-1' }, { id: 'image-2', base64image: 'base64-2' }]
        })
      });

    await fetchBenefitsByCategory(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith([
      { id: 'benefit-1', name: 'Benefit 1', images: ['base64-1'] },
      { id: 'benefit-2', name: 'Benefit 2', images: ['base64-2'] }
    ])).to.be.true;
  });

  it('should handle errors and return 500', async () => {
    sinon.stub(supabase, 'from').throws(new Error('Database error'));

    await fetchBenefitsByCategory(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
  });
});