import { Link } from "react-router-dom";

function LandingPage() {
  const services = [
    {
      title: "Pet Checkup",
      description: "Complete health examination to monitor your pet’s condition.",
    },
    {
      title: "Vaccination",
      description: "Protect your pets with scheduled vaccines and reminders.",
    },
    {
      title: "Surgery",
      description: "Safe surgical care performed by experienced veterinarians.",
    },
    {
      title: "Emergency Care",
      description: "Fast treatment for urgent and critical pet health cases.",
    },
    {
      title: "Video Consultation",
      description:
        "Talk with a doctor remotely when you cannot visit the hospital.",
    },
    {
      title: "Online Payment",
      description: "Pay hospital bills easily and securely through the app.",
    },
  ];

  const doctors = [
    {
      name: "Dr. John Smith",
      specialty: "Pet Surgery",
      description:
        "Specialized in advanced surgical procedures and soft tissue surgery.",
    },
    {
      name: "Dr. Sarah Lee",
      specialty: "Vaccination & Care",
      description:
        "Expert in pet vaccinations, preventive care, and wellness programs.",
    },
    {
      name: "Dr. Michael Brown",
      specialty: "Emergency Care",
      description:
        "Available for emergency care, urgent cases, and critical treatments.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100">
      <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            PetCare Hospital
          </h1>

          <div className="hidden lg:flex gap-6 font-medium text-gray-700 dark:text-gray-300">
            <a href="#" className="hover:text-blue-700 dark:hover:text-blue-400">
              Home
            </a>
            <a
              href="#services"
              className="hover:text-blue-700 dark:hover:text-blue-400"
            >
              Services
            </a>
            <a
              href="#doctors"
              className="hover:text-blue-700 dark:hover:text-blue-400"
            >
              Doctors
            </a>
            <a
              href="#contact"
              className="hover:text-blue-700 dark:hover:text-blue-400"
            >
              Contact
            </a>
          </div>

          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg border border-blue-700 dark:border-blue-400 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 dark:text-white">
            Professional Care for Your Beloved Pets
          </h2>

          <p className="mt-6 text-base md:text-lg text-gray-600 dark:text-gray-300">
            Book appointments, manage pet medical records, pay bills online, and
            consult doctors through video calls.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 text-center"
            >
              Request Appointment
            </Link>

            <a
              href="#services"
              className="px-6 py-3 rounded-lg border border-blue-700 dark:border-blue-400 text-blue-700 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-gray-800 text-center"
            >
              Our Services
            </a>
          </div>
        </div>

        <div className="bg-blue-100 dark:bg-gray-900 border dark:border-gray-800 rounded-3xl p-8 md:p-10 text-center shadow">
          <div className="text-7xl md:text-8xl mb-6">🐶</div>
          <h3 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-400">
            Pet Hospital System
          </h3>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            A complete system for owners, doctors, receptionists, and admins.
          </p>
        </div>
      </section>

      <section id="services" className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white">
            Our Services
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition"
              >
                <div className="text-4xl mb-4">🐾</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {service.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="doctors" className="py-16 bg-blue-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-3 text-gray-900 dark:text-white">
            Our Doctors
          </h2>

          <div className="w-12 h-1 bg-blue-700 dark:bg-blue-400 mx-auto rounded-full mb-10" />

          <div className="grid md:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.name}
                className="doctor-card bg-white dark:bg-gray-900 border dark:border-gray-800 p-6 rounded-2xl shadow text-center transition"
              >
                <div className="text-5xl mb-4">👨‍⚕️</div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {doctor.name}
                </h3>

                <p className="speciality text-blue-700 dark:text-blue-400 font-medium mt-1">
                  {doctor.specialty}
                </p>

                <p className="text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
                  {doctor.description}
                </p>

                <button className="mt-6 bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Why Choose Us?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            <Feature text="24/7 Support" />
            <Feature text="Expert Doctors" />
            <Feature text="Online Payment" />
            <Feature text="Video Consultation" />
          </div>
        </div>
      </section>

      <footer
        id="contact"
        className="bg-gray-900 dark:bg-black text-white py-8 text-center px-4"
      >
        <p className="font-semibold">PetCare Hospital</p>
        <p className="text-gray-400 mt-2">Beirut, Lebanon | +961 70 123 456</p>
      </footer>
    </div>
  );
}

function Feature({ text }) {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 border dark:border-gray-800 rounded-2xl text-gray-800 dark:text-gray-100">
      {text}
    </div>
  );
}

export default LandingPage;