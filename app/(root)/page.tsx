export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-navy text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 fade-in-up text-white">
            My Smart Digital School
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-sky-light fade-in-up fade-in-delay-200">
            An AI-driven platform for sustainable, personalized computer-science education.
          </p>
          <p className="text-lg md:text-xl mb-12 max-w-4xl mx-auto text-gray-300 fade-in-up fade-in-delay-400">
            Empower every student with hands-on lessons, real-time analytics, and eco-friendly activities—all tailored by intelligent algorithms.
          </p>
          <button className="bg-amber text-navy text-lg px-10 py-4 rounded-lg font-semibold hover-lift transition-all duration-300 fade-in-up fade-in-delay-600">
            Get Started
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-navy fade-in-up">
            Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md hover-lift transition-all duration-300 border border-gray-100 fade-in-up">
              <div className="w-16 h-16 bg-sky-light-10 rounded-lg flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-sky-light rounded"></div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-navy">AI-Powered Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Analyze each student&apos;s skill level and recommend the perfect next exercise using cutting-edge AI models.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md hover-lift transition-all duration-300 border border-gray-100 fade-in-up fade-in-delay-200">
              <div className="w-16 h-16 bg-amber-10 rounded-lg flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-amber rounded"></div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-navy">Interactive Lesson Library</h3>
              <p className="text-gray-600 leading-relaxed">
                Engage learners with bite-sized modules built in PowerPoint, Scratch, and Canva—no two lessons are the same.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md hover-lift transition-all duration-300 border border-gray-100 fade-in-up fade-in-delay-400">
              <div className="w-16 h-16 bg-teal-10 rounded-lg flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-teal rounded"></div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-navy">Teacher Analytics Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">
                See live performance metrics, identify knowledge gaps, and intervene at precisely the right moment.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md hover-lift transition-all duration-300 border border-gray-100 fade-in-up fade-in-delay-600">
              <div className="w-16 h-16 bg-orange-10 rounded-lg flex items-center justify-center mb-6">
                <div className="w-8 h-8 bg-orange rounded"></div>
              </div>
              <h3 className="text-xl font-bold mb-4 text-navy">Sustainability Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Embed energy-saving tips and e-waste recycling challenges to foster responsible digital citizens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-navy fade-in-up">
            How It Works
          </h2>
          <div className="grid md:grid-cols-5 gap-8">
            {[
              {
                step: "1",
                title: "Assess & Onboard",
                description: "Run a quick diagnostic to map each student's strengths and weaknesses.",
                color: "sky-light"
              },
              {
                step: "2", 
                title: "Design & Customize",
                description: "Auto-generate a curriculum path and interactive modules tailored to class needs.",
                color: "teal"
              },
              {
                step: "3",
                title: "Pilot & Iterate", 
                description: "Launch in one classroom, collect feedback, and refine in real time.",
                color: "navy"
              },
              {
                step: "4",
                title: "Measure Impact",
                description: "Track learning gains, engagement rates, and eco-activity participation.",
                color: "amber"
              },
              {
                step: "5",
                title: "Scale & Share",
                description: "Roll out across your school district with one click—and share best practices with peers.",
                color: "orange"
              }
            ].map((item, index) => (
              <div key={index} className={`text-center fade-in-up fade-in-delay-${index * 200}`}>
                <div className={`w-16 h-16 bg-${item.color} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 hover-lift transition-transform duration-300`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-4 text-navy">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section id="who-its-for" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-navy fade-in-up">
            Who It&apos;s For
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="bg-white rounded-xl p-10 shadow-sm hover:shadow-md hover-lift transition-all duration-300 text-center border border-gray-100 fade-in-up">
              <div className="w-20 h-20 bg-sky-light-10 rounded-full flex items-center justify-center mx-auto mb-8">
                <div className="w-10 h-10 bg-sky-light rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-navy">Secondary-School Students</h3>
              <p className="text-gray-600 leading-relaxed">
                Looking for dynamic, hands-on coding and CS lessons.
              </p>
            </div>

            <div className="bg-white rounded-xl p-10 shadow-sm hover:shadow-md hover-lift transition-all duration-300 text-center border border-gray-100 fade-in-up fade-in-delay-200">
              <div className="w-20 h-20 bg-amber-10 rounded-full flex items-center justify-center mx-auto mb-8">
                <div className="w-10 h-10 bg-amber rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-navy">Computer-Science Teachers</h3>
              <p className="text-gray-600 leading-relaxed">
                Who need fine-grained insight into every learner.
              </p>
            </div>

            <div className="bg-white rounded-xl p-10 shadow-sm hover:shadow-md hover-lift transition-all duration-300 text-center border border-gray-100 fade-in-up fade-in-delay-400">
              <div className="w-20 h-20 bg-teal-10 rounded-full flex items-center justify-center mx-auto mb-8">
                <div className="w-10 h-10 bg-teal rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-navy">School Administrators & Parents</h3>
              <p className="text-gray-600 leading-relaxed">
                Wanting transparent progress reports and sustainability metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-navy text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white fade-in-up">
            Ready to transform your classroom?
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-sky-light fade-in-up fade-in-delay-200">
            Unlock personalized learning and green-tech lessons today.
          </p>
          <button className="bg-amber text-navy text-lg px-10 py-4 rounded-lg font-semibold hover-lift transition-all duration-300 fade-in-up fade-in-delay-400">
            Start Your Free Trial
          </button>
        </div>
      </section>
    </div>
  );
}
