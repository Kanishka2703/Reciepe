import { useState } from "react";
import axios from 'axios';
import './RecipeForm.css';
const RecipeForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        cuisine: 'italian',
        description: '',
        steps: [''], // Initialize with one empty step
        ingredients: '',
        instructions: '',
        cookingTime: '',
        difficultyLevel: '',
        image: null
    });

    const handleChange = (e, index) => {
        const { name, value } = e.target;
        if (name === 'steps') {
            const newSteps = [...formData.steps];
            newSteps[index] = value;
            setFormData({ ...formData, steps: newSteps });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        // Add a new step input box if the current step input box is being edited
        if (name === 'steps' && index === formData.steps.length - 1) {
            setFormData({ ...formData, steps: [...formData.steps, ''] });
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.key === 'Enter') {
            const newSteps = [...formData.steps];
            newSteps.splice(index + 1, 0, '');
            setFormData({ ...formData, steps: newSteps });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, image: file });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.image) {
            alert('Please select an image.');
            return;
        }
        const formDataToSend = new FormData();

        // Append form data fields
        for (const key in formData) {
            if (key === 'steps') {
                formData.steps.forEach((step, index) => {
                    formDataToSend.append(`${key}[${index}]`, step);
                });
            } else {
                formDataToSend.append(key, formData[key]);
            }
        }

        try {
            const response = await axios.post('http://localhost:8000/recipes/create', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.status === 200) {
                setFormData({
                    title: '',
                    cuisine: 'italian',
                    description: '',
                    steps: [''],
                    ingredients: '',
                    instructions: '',
                    cookingTime: '',
                    difficultyLevel: '',
                    image: null // Reset the image state to null
                });

                // Reset the file input visually
                document.getElementById('imageInput').value = '';
            } else {
                alert("Failed to create recipe.");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("An error occurred while creating recipe.");
        }
    };



    return (
        <div className="outerer-container">
            <div className="container">
                <h1 className='adding'>Add Recipe</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title</label>
                        <input type="text" className="input-create-form" name="title" value={formData.title} onChange={handleChange} placeholder="Give your recipe a name" />
                    </div>
                    <div className="form-group">
                        <label>Cuisine</label>
                        <select name="cuisine" className="input-create-form" value={formData.cuisine} onChange={handleChange}>
                            <option value="italian">Italian</option>
                            <option value="chinese">Chinese</option>
                            <option value="mexican">Mexican</option>
                            <option value="thai">Thai</option>
                            <option value="japanese">Japanese</option>
                            <option value="north-indian">North Indian</option>
                            <option value="south-indian">South Indian</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea rows={3} className="input-create-form" name="description" value={formData.description} onChange={handleChange} placeholder="Introduce your recipe, add notes, cooking tips, serving suggestions, etc..." />
                    </div>
                    <div className="form-group">
                        <label>Steps</label>
                        {formData.steps.map((step, index) => (
                            <input
                                className="input-create-form input-steps"
                                key={index}
                                type="text"
                                name="steps"
                                value={step}
                                onChange={(e) => handleChange(e, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                placeholder={`Step ${index + 1}`}
                            />
                        ))}
                    </div>
                    <div className="form-group">
                        <label>Ingredients</label>
                        <input type="text" className="input-create-form" name="ingredients" value={formData.ingredients} onChange={handleChange} placeholder="Enter the ingredients" />
                    </div>
                    <div className="form-group">
                        <label>Instructions</label>
                        <textarea rows={3} className="input-create-form" name="instructions" value={formData.instructions} onChange={handleChange} placeholder="Enter the instructions" />
                    </div>
                    <div className="form-group">
                        <label>Cooking Time(mins)</label>
                        <input type="number" name="cookingTime" className="time" value={formData.cookingTime} onChange={handleChange} placeholder="Enter the cooking time" />
                    </div>
                    <div className="form-group">
                        <label>Difficulty Level</label>
                        <select name="difficultyLevel" className="input-create-form" value={formData.difficultyLevel} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="Easy">Easy</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Difficult">Difficult</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Image</label>
                        <input type="file" id="imageInput" className="input-file" name="image" onChange={handleImageChange} required />
                    </div>
                    <button type="submit" className="submit-button">Save</button>
                </form>
            </div>
        </div>
    );
};

export default RecipeForm;
