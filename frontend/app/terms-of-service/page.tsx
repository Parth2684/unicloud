export const metadata = {
  title: "Terms of Service | UniCloud",
  description: "Terms of Service for UniCloud",
};

export default function TermsOfServicePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-10">
        Effective Date: 11th February, 2026
      </p>

      <section className="space-y-6 text-gray-800 leading-relaxed">
        <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
        <p>
          By accessing or using UniCloud, you agree to be bound by these Terms.
          If you do not agree, do not use the service.
        </p>

        <h2 className="text-2xl font-semibold">2. Description of Service</h2>
        <p>
          UniCloud allows users to link multiple cloud storage accounts,
          transfer files between providers.
        </p>

        <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide accurate account information</li>
          <li>Maintain security of your login credentials</li>
          <li>Comply with applicable laws</li>
        </ul>

        <h2 className="text-2xl font-semibold">4. Prohibited Use</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Illegal activity</li>
          <li>Uploading or transferring unlawful content</li>
          <li>Attempting to exploit system vulnerabilities</li>
          <li>Abusing system resources or APIs</li>
        </ul>

        <h2 className="text-2xl font-semibold">5. Third-Party Providers</h2>
        <p>
          UniCloud depends on third-party cloud providers. We are not
          responsible for outages, API limitations, or actions taken by
          those providers.
        </p>

        <h2 className="text-2xl font-semibold">6. Disclaimer</h2>
        <p>
          The service is provided "as is" without warranties of any kind.
          We are not liable for data loss, service interruptions, or
          third-party failures.
        </p>

        <h2 className="text-2xl font-semibold">7. Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these terms.
        </p>

        <h2 className="text-2xl font-semibold">8. Governing Law</h2>
        <p>
          These Terms are governed by the laws of India/Maharashtra.
        </p>

        <h2 className="text-2xl font-semibold">9. Contact</h2>
        <p>
          For questions, contact us at: <br />
          <strong>bhosle6006@gmail.com</strong>
        </p>
      </section>
    </main>
  );
}
