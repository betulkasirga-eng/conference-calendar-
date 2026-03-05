export const metadata = {
  title: '2026 EPSP AERA CALENDAR',
  description: 'Conference attendee tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
