import "./globals.css";

export const metadata = {
  title: "Plataforma de Consumo IA",
  description: "Interfaz para visualizar cuotas y límites de uso"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
