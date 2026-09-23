export default function WhatsAppButton({ link, label = "Confirm order on WhatsApp" }) {
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-block">
      {label}
    </a>
  );
}
