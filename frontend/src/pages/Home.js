import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  MapPin, 
  MessageCircle, 
  Users, 
  Leaf, 
  Clock,
  ArrowRight,
  Play
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: <Heart className="w-8 h-8 text-primary-600" />,
      title: 'Reduce Food Waste',
      description: 'Connect surplus food with those who need it, making a positive impact on the environment.'
    },
    {
      icon: <MapPin className="w-8 h-8 text-primary-600" />,
      title: 'Location-Based Matching',
      description: 'Find food near you with our intelligent location-based matching system.'
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-primary-600" />,
      title: 'Real-Time Chat',
      description: 'Communicate directly with donors and receivers through our instant messaging system.'
    },
    {
      icon: <Users className="w-8 h-8 text-primary-600" />,
      title: 'Community Building',
      description: 'Join a community of people committed to reducing food waste and helping others.'
    },
    {
      icon: <Leaf className="w-8 h-8 text-primary-600" />,
      title: 'Sustainable Impact',
      description: 'Track your environmental impact and contribute to a more sustainable future.'
    },
    {
      icon: <Clock className="w-8 h-8 text-primary-600" />,
      title: 'Quick & Easy',
      description: 'Simple and intuitive interface for posting and claiming food in minutes.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Food Items Shared' },
    { number: '500+', label: 'Active Users' },
    { number: '50+', label: 'Cities Covered' },
    { number: '2.5K', label: 'Lbs of Food Saved' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Share Food,{' '}
                <span className="text-primary-600">Save Lives</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Connect surplus food from restaurants, hostels, and households with NGOs, 
                charities, and people in need. Together, we can reduce food waste and 
                build a more sustainable community.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/register"
                  className="btn-primary btn-lg group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/food"
                  className="btn-outline btn-lg"
                >
                  Browse Food
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-bounce-gentle"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-secondary-200 rounded-full opacity-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-5 w-16 h-16 bg-accent-200 rounded-full opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How FoodShare Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to make a difference in your community
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Post Available Food',
                description: 'Donors can easily post surplus food with details, photos, and pickup times.',
                color: 'primary'
              },
              {
                step: '2',
                title: 'Find & Request',
                description: 'Receivers browse available food and send requests with pickup preferences.',
                color: 'secondary'
              },
              {
                step: '3',
                title: 'Connect & Share',
                description: 'Donors approve requests and coordinate pickup through our chat system.',
                color: 'accent'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`w-16 h-16 rounded-full bg-${item.color}-100 text-${item.color}-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FoodShare?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make food sharing simple and effective
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="card p-6 text-center hover:shadow-medium transition-shadow duration-300"
              >
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              See how FoodShare is making a difference in communities
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-100">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of people who are already reducing food waste and helping 
              their communities through FoodShare.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="btn-primary btn-lg group"
              >
                Start Sharing Food
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/food"
                className="btn-outline btn-lg"
              >
                Explore Available Food
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home; 