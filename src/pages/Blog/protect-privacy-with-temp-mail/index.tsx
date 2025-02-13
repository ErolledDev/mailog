import React from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogPost() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <Link 
        to="/blog" 
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Blog
      </Link>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            Oct 25
          </span>
          <span className="text-sm text-blue-600">• Decor</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          The 6 Worst Interior Design Jobs in History
        </h1>
        <p className="text-gray-600">
          How hollywood got apartment guides all wrong. The complete beginner's guide to interior design ideas.
        </p>
      </header>

      <img
        src="https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&q=80&w=1600"
        alt="Interior Design"
        className="w-full h-[400px] object-cover rounded-lg mb-8"
      />

      <div className="prose prose-lg max-w-none">
        <p>
          Interior design is more than just arranging furniture and choosing colors. It's about creating 
          functional, aesthetically pleasing spaces that enhance people's lives. However, throughout history, 
          there have been some notable mishaps in the world of interior design.
        </p>

        <h2>1. The Victorian Era Excess</h2>
        <p>
          While the Victorian era is known for its ornate designs, some interiors went too far with:
        </p>
        <ul>
          <li>Overwhelming patterns and textures</li>
          <li>Excessive use of heavy drapery</li>
          <li>Cluttered spaces with too many decorative items</li>
          <li>Dark, oppressive color schemes</li>
        </ul>

        <h2>2. The 1970s Design Disasters</h2>
        <p>
          The 1970s brought some questionable design choices:
        </p>
        <ul>
          <li>Shag carpeting in bathrooms</li>
          <li>Avocado green appliances</li>
          <li>Wood paneling everywhere</li>
          <li>Overwhelming wallpaper patterns</li>
        </ul>

        <h2>3. Modern Design Mistakes</h2>
        <p>
          Even in modern times, we see common design errors:
        </p>
        <ul>
          <li>Ignoring functionality for aesthetics</li>
          <li>Poor space planning</li>
          <li>Inadequate lighting solutions</li>
          <li>Mismatched design elements</li>
        </ul>

        <h2>Lessons Learned</h2>
        <p>
          From these historical design mistakes, we can learn valuable lessons:
        </p>
        <ol>
          <li>Balance is key in design</li>
          <li>Functionality should never be sacrificed for style</li>
          <li>Consider long-term appeal over current trends</li>
          <li>Quality materials matter</li>
        </ol>

        <h2>Conclusion</h2>
        <p>
          While these design mistakes might seem obvious now, they serve as important lessons for modern 
          interior designers. Understanding past failures helps create better, more thoughtful spaces today.
        </p>
      </div>

      {/* Ads Section */}
      <div className="mt-12 bg-pink-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">ads here</p>
      </div>
    </article>
  );
}