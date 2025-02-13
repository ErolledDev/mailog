import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The 6 Worst Interior Design Jobs in History',
    excerpt: "How hollywood got apartment guides all wrong. The complete beginner's guide to interior design ideas.",
    date: 'Oct 25',
    category: 'Decor',
    image: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&q=80&w=800',
    slug: 'worst-interior-design-jobs'
  },
  {
    id: '2',
    title: 'Median UI - Blogger Template (Sample Post Product)',
    excerpt: 'A complete guide to blogger templates and themes. Why you should be using more blog templates.',
    date: 'Mar 16',
    category: 'Product',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    slug: 'median-ui-template'
  },
  {
    id: '3',
    title: '14 Things Your Boss Expects You Know About Weight Loss Success Stories',
    excerpt: 'What experts are saying about weight loss meal plans. 5 things your boss expects you know about travel vaccines.',
    date: 'Mar 14',
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800',
    slug: 'weight-loss-success'
  },
  {
    id: '4',
    title: 'An Expert Interview About Honeymoon Packages',
    excerpt: 'Why travel tips will make you question everything. The complete beginner\'s guide to honeymoon packages.',
    date: 'Mar 13',
    category: 'Activities',
    image: 'https://images.unsplash.com/photo-1510511336377-1a9d7d242f3d?auto=format&fit=crop&q=80&w=800',
    slug: 'honeymoon-packages'
  },
  {
    id: '5',
    title: 'What Wikipedia Can\'t Tell You About Salon Services',
    excerpt: "Why beauty salon success stories are killing you. 14 facts about hair salons that'll keep you up at night.",
    date: 'Mar 13',
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800',
    slug: 'salon-services'
  }
];

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setPosts(blogPosts);
      setLoading(false);
    };

    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Featured post is the first post
  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/" className="hover:text-blue-600">Home</Link>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span>Blog</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <div className="mb-12">
          <Link to={`/blog/${featuredPost.slug}`} className="block">
            <div className="relative h-[400px] w-full rounded-lg overflow-hidden mb-4">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">
                <Calendar className="w-4 h-4 inline-block mr-1" />
                {featuredPost.date}
              </span>
              <span className="text-sm text-blue-600">• {featuredPost.category}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors mb-2">
              {featuredPost.title}
            </h2>
            <p className="text-gray-600">{featuredPost.excerpt}</p>
          </Link>
        </div>
      )}

      {/* All Stories Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-6">All stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularPosts.map((post) => (
            <article key={post.id} className="group">
              <Link to={`/blog/${post.slug}`}>
                <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    {post.date}
                  </span>
                  <span className="text-sm text-blue-600">• {post.category}</span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600">{post.excerpt}</p>
              </Link>
            </article>
          ))}
        </div>
      </div>

      {/* Ads Section */}
      <div className="bg-pink-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">ads here</p>
      </div>
    </main>
  );
}