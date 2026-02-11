export const metadata = {
  title: "Privacy Policy | UniCloud",
  description: "Privacy Policy for UniCloud",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">
        Effective Date: 11th February, 2026
      </p>

      <section className="space-y-6 text-gray-800 leading-relaxed">
        <h2 className="text-2xl font-semibold">1. Introduction</h2>
        <p>
          UniCloud provides a cloud aggregation platform
          that allows users to connect multiple cloud storage accounts,
          search across them, and transfer files between providers.
        </p>
        <p>
          By using UniCloud, you agree to this Privacy Policy.
        </p>

        <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Name and email address</li>
          <li>Authentication data via OAuth providers (e.g., Google)</li>
          <li>Linked cloud account identifiers</li>
          <li>Whole access to your Google Drive</li>
          <li>Usage logs and error logs</li>
        </ul>

        <h2 className="text-2xl font-semibold">3. How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide cloud search and transfer functionality</li>
          <li>To authenticate users securely</li>
          <li>To monitor performance and improve the platform</li>
          <li>To prevent abuse and security threats</li>
        </ul>

        <h2 className="text-2xl font-semibold">4. Data Security</h2>
        <p>
          OAuth tokens are encrypted before storage. We use secure HTTPS
          communication and official cloud provider APIs.
        </p>
        <p>
          However, no system is completely secure. You use UniCloud at your own risk. But we try our best never let it happen
        </p>

        <h2 className="text-2xl font-semibold">5. Third-Party Services</h2>
        <p>
          UniCloud integrates with third-party cloud providers. Your use of
          those services is subject to their own terms and privacy policies.
        </p>

        <h2 className="text-2xl font-semibold">6. Data Retention</h2>
        <p>
          We retain account data while your account is active. You may request
          deletion of your account at any time.
        </p>

        <h2 className="text-2xl font-semibold">7. Contact</h2>
        <p>
          For questions, contact us at: <br />
          <strong>bhosle6006@gmail.com</strong>
        </p>
      </section>
    </main>
  );
}
