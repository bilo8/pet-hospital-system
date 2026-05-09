import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function VerifyEmailPage() {
  const { token } = useParams();

  const [message, setMessage] = useState("Verifying email...");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios
      .get(
        `${import.meta.env.VITE_API_URL}/api/temporary-registrations/verify/${token}`
      )
      .then((res) => {
        setMessage(res.data.message);
        setSuccess(true);
      })
      .catch((err) => {
        const backendMessage = err.response?.data?.message;

        if (backendMessage?.includes("Invalid or expired")) {
          setMessage(
            "Email verified, you can visit the hospital to complete your registration."
          );
        } else {
          setMessage("We could not verify your email. Please try again later.");
        }

        setSuccess(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">
          Email Verification
        </h1>

        <p
          className={`mb-6 ${success ? "text-green-600" : "text-yellow-600"
            }`}
        >
          {message}
        </p>

        <Link
          to="/"
          className="inline-block bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default VerifyEmailPage;