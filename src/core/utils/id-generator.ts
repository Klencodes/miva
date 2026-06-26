export const generateCode = (pfx: string) => {
  const date = new Date();
  const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of year
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  // Generate 6 random alphanumeric characters (A-Z, 0-9)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  const prefix = pfx || "INV";
  return `${prefix}${year}${month}${day}${random}`;
};