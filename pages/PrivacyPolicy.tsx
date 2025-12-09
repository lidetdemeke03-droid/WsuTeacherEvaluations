
import React from 'react';
import BackButton from '../components/BackButton';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="relative bg-gray-100 min-h-screen">
      <div className="absolute top-4 left-4">
        <BackButton />
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Privacy Policy for Wolaita Sodo University Teacher Evaluation System</h1>
          <p className="mb-4 text-gray-600">
            This Privacy Policy describes how Wolaita Sodo University ("WSU", "we", "us", or "our") collects, uses, and discloses your information in connection with your use of our Teacher Evaluation System (the "Service").
          </p>

          <h2 className="text-2xl font-bold mb-2 text-gray-800">1. Information We Collect</h2>
          <p className="mb-4 text-gray-600">
            We may collect the following types of information when you use the Service:
          </p>
          <ul className="list-disc list-inside mb-4 text-gray-600">
            <li><strong>Personal Information:</strong> This includes your name, email address, student or faculty ID number, department, and other information you provide when you create an account or use the Service.</li>
            <li><strong>Evaluation Data:</strong> This includes your responses to evaluation questionnaires, including your ratings and comments about instructors and courses.</li>
            <li><strong>Usage Data:</strong> We may automatically collect information about how you use the Service, such as your IP address, browser type, operating system, and the pages you visit.</li>
          </ul>

          <h2 className="text-2xl font-bold mb-2 text-gray-800">2. How We Use Your Information</h2>
          <p className="mb-4 text-gray-600">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc list-inside mb-4 text-gray-600">
            <li>To provide, operate, and maintain the Service.</li>
            <li>To improve the quality of teaching and learning at WSU.</li>
            <li>To generate aggregated and anonymized reports for administrative and research purposes.</li>
            <li>To communicate with you about the Service, including sending you notifications and updates.</li>
            <li>To enforce our policies and comply with legal obligations.</li>
          </ul>

          <h2 className="text-2xl font-bold mb-2 text-gray-800">3. How We Share Your Information</h2>
          <p className="mb-4 text-gray-600">
            We are committed to protecting your privacy and will not share your personal information with third parties except in the following circumstances:
          </p>
          <ul className="list-disc list-inside mb-4 text-gray-600">
            <li><strong>Anonymized Data:</strong> We may share aggregated and anonymized data with academic departments and administrators for the purpose of improving teaching quality. Your personal identity will not be revealed in these reports.</li>
            <li><strong>With Your Consent:</strong> We may share your information with your consent.</li>
            <li><strong>For Legal Reasons:</strong> We may disclose your information if we are required to do so by law or in response to a valid legal request.</li>
          </ul>

          <h2 className="text-2xl font-bold mb-2 text-gray-800">4. Data Security</h2>
          <p className="mb-4 text-gray-600">
            We take reasonable measures to protect your information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is 100% secure.
          </p>

          <h2 className="text-2xl font-bold mb-2 text-gray-800">5. Your Choices</h2>
          <p className="mb-4 text-gray-600">
            You may have the right to access, correct, or delete your personal information. You may also have the right to object to or restrict certain processing of your information. To exercise these rights, please contact us at [Insert Contact Email or Office].
          </p>

          <h2 className="text-2xl font-bold mb-2 text-gray-800">6. Changes to This Privacy Policy</h2>
          <p className="mb-4 text-gray-600">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>

          <h2 className="text-2xl font-bold mb-2 text-gray-800">7. Contact Us</h2>
          <p className="mb-4 text-gray-600">
            If you have any questions about this Privacy Policy, please contact us at [Insert Contact Email or Office].
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
