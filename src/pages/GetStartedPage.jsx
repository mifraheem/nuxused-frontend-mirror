import React from 'react'
import { useNavigate } from 'react-router-dom';
import start from '/start.png'
import '../index.css'


function GetStartedPage() {
    const school = 'Acadian'
    const navigate = useNavigate();

    const goToLogin = () => {
        navigate('/login');
    }
    return (
        <div className=" flex items-center justify-center">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <img src={start} alt="School Management" className="w-5/6 max-w-lg" />
                </div>

                <div className="ml-12 max-w-lg">
                    <div className="mb-6">
                        <h1 className="text-4xl font-bold text-blue-950">{school}</h1>
                        <p className="text-lg text-gray-700 mt-4">
                            Manage all aspects of your school effortlessly with our modern and intuitive system. Stay ahead in
                            organization and efficiency.
                        </p>
                    </div>
                    <button
                        onClick={goToLogin}
                        className="bg-blue-950 rounded-full shadow-lg text-white px-8 py-3  text-lg hover:bg-blue-800 transition-all"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GetStartedPage