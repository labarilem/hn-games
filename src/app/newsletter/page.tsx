import KitNewsletterForm from "../../components/KitNewsletterForm";

export default function Newsletter() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Newsletter</h1>
      <p className="text-gray-400 mb-8">
        Subscribe to get notified about the latest games added to our catalog.
        <br></br>
        There isn't a regular schedule, you'll receive few emails.
      </p>
      <div className="bg-[#242424] rounded-lg p-6">
        <KitNewsletterForm />
      </div>
    </div>
  );
}


