import React from 'react';
import { FaYoutube, FaEnvelope } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-amber-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-amber-600 h-32 flex items-center justify-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white">About Divine Mantras</h1>
          </div>
          
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6">Our Mission</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Divine Mantras is dedicated to preserving and sharing the sacred tradition of mantra chanting 
              from Hindu spirituality. Our platform provides authentic mantras, their meanings, and proper 
              chanting techniques to help spiritual seekers connect with the divine energies of various deities.
            </p>
            
            <p className="text-gray-700 mb-8 leading-relaxed">
              We believe in making spiritual practices accessible to everyone, regardless of their background or 
              level of experience. Each mantra on our platform has been carefully selected and presented with its 
              original Sanskrit text, transliteration, meaning, and benefits to ensure an authentic spiritual experience.
            </p>
            
            <div className="border-t border-gray-200 pt-8 mb-8"></div>
            
            <h2 className="text-2xl font-bold text-amber-800 mb-6">About the Founder</h2>
            
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="w-44 h-44 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center">
                <span className="text-6xl text-amber-600">ॐ</span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-700 mb-2">Keshav Mohta</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  I am a Chartered Accountant by profession but have always maintained a keen interest in spirituality 
                  and the ancient wisdom of Vedic traditions. My journey with mantras began as a personal practice that 
                  eventually grew into a passion for sharing these powerful spiritual tools with others.
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Through Divine Mantras, I aim to bridge the gap between the ancient spiritual traditions and the 
                  modern world, making the profound benefits of mantra chanting accessible to everyone seeking spiritual growth, 
                  mental peace, and connection with the divine.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  I believe that mantras are not just religious practices but universal tools for transformation that can 
                  benefit anyone, regardless of their cultural or religious background.
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-8"></div>
            
            <h2 className="text-2xl font-bold text-amber-800 mb-6">Connect With Us</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <a 
                href="https://youtube.com/@spiritualguru-?si=dj_fnIkxsIAceS95" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <FaYoutube className="text-xl" />
                <span>YouTube Channel</span>
              </a>
              
              <a 
                href="mailto:keshav.mohta7@gmail.com"
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <FaEnvelope className="text-xl" />
                <span>keshav.mohta7@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}