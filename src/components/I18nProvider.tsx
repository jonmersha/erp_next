"use client";
import i18n from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { useEffect, useState } from "react";

// Translations
const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Operations": "Operations",
      "Planning": "Planning",
      "Procurement": "Procurement",
      "Inventory": "Inventory",
      "Production": "Production",
      "Recipes": "Recipes",
      "Maintenance": "Maintenance",
      "Logistics": "Logistics",
      "Quality": "Quality",
      "Sales & Finance": "Sales & Finance",
      "Sales": "Sales",
      "Finance": "Finance",
      "Admin Panel": "Admin Panel",
      "Administration": "Administration",
      "HR": "HR",
      "Users": "Users",
      "Master Data": "Master Data",
      "Sheger ERP": "Sheger ERP",
      "Sign Out": "Sign Out",
      "Toggle Theme": "Toggle Theme",
      "Change Language": "Change Language",
      "English": "English",
      "Amharic": "Amharic",
      "Afaan Oromoo": "Afaan Oromoo",
      "Save": "Save",
      "Cancel": "Cancel",
      "Edit": "Edit",
      "Delete": "Delete",
      "Add New": "Add New",
      "Create": "Create",
      "Submit": "Submit",
      "Update": "Update",
      "Save Changes": "Save Changes",
      "Ship Items": "Ship Items",
      "Print": "Print",
      "View Details": "View Details",
      "Back": "Back",
      "Manage Roles": "Manage Roles",
      "Updating": "Updating...",
      "Add Item": "Add Item",
      "Create Purchase Order": "Create Purchase Order",
      "Update Purchase Order": "Update Purchase Order",
      "Log Maintenance": "Log Maintenance",
      "Save Log": "Save Log",
      "Track Shipment": "Track Shipment",
      "Save Shipment": "Save Shipment",
      "Save Recipe": "Save Recipe",
      "Auto-Generate": "Auto-Generate Missing",
      "New Recipe": "New Recipe"
    }
  },
  am: {
    translation: {
      "Dashboard": "ዳሽቦርድ",
      "Operations": "ክዋኔዎች",
      "Planning": "እቅድ",
      "Procurement": "ግዥ",
      "Inventory": "እቃዎች",
      "Production": "ምርት",
      "Recipes": "አሰራሮች",
      "Maintenance": "ጥገና",
      "Logistics": "ሎጂስቲክስ",
      "Quality": "ጥራት",
      "Sales & Finance": "ሽያጭ እና ፋይናንስ",
      "Sales": "ሽያጭ",
      "Finance": "ፋይናንስ",
      "Admin Panel": "አስተዳዳሪ ፓነል",
      "Administration": "አስተዳደር",
      "HR": "የሰው ኃይል",
      "Users": "ተጠቃሚዎች",
      "Master Data": "ዋና ዳታ",
      "Sheger ERP": "ሸገር ERP",
      "Sign Out": "ውጣ",
      "Toggle Theme": "ገጽታ መቀየሪያ",
      "Change Language": "ቋንቋ ቀይር",
      "English": "እንግሊዝኛ",
      "Amharic": "አማርኛ",
      "Afaan Oromoo": "አፋን ኦሮሞ",
      "Save": "አስቀምጥ",
      "Cancel": "ሰርዝ",
      "Edit": "አስተካክል",
      "Delete": "አጥፋ",
      "Add New": "አዲስ ጨምር",
      "Create": "ፍጠር",
      "Submit": "አስገባ",
      "Update": "አዘምን",
      "Save Changes": "ለውጦችን አስቀምጥ",
      "Ship Items": "ዕቃዎችን ላክ",
      "Print": "አትም",
      "View Details": "ዝርዝሮችን እይ",
      "Back": "ወደ ኋላ",
      "Manage Roles": "ሚናዎችን አስተዳድር",
      "Updating": "እያዘመነ ነው...",
      "Add Item": "ዕቃ ጨምር",
      "Create Purchase Order": "የግዢ ማዘዣ ፍጠር",
      "Update Purchase Order": "የግዢ ማዘዣ አዘምን",
      "Log Maintenance": "ጥገናን መዝግብ",
      "Save Log": "መዝገብ አስቀምጥ",
      "Track Shipment": "ጭነት ክትትል",
      "Save Shipment": "ጭነት አስቀምጥ",
      "Save Recipe": "የአሰራር ዘዴ አስቀምጥ",
      "Auto-Generate": "በራስ-ሰር አፍልቅ",
      "New Recipe": "አዲስ አሰራር"
    }
  },
  om: {
    translation: {
      "Dashboard": "Daaishboordii",
      "Operations": "Hojiiwwan",
      "Planning": "Karoora",
      "Procurement": "Bittaa",
      "Inventory": "Kuusaa",
      "Production": "Oomisha",
      "Recipes": "Qajeelfama Hojii",
      "Maintenance": "Suphaa",
      "Logistics": "Lojistikii",
      "Quality": "Qulqullina",
      "Sales & Finance": "Gurgurtaa fi Faayinaansii",
      "Sales": "Gurgurtaa",
      "Finance": "Faayinaansii",
      "Admin Panel": "To'annoo Bulchaa",
      "Administration": "Bulchiinsa",
      "HR": "Namooota",
      "Users": "Fayyadamtota",
      "Master Data": "Daataa Ijoo",
      "Sheger ERP": "Sheger ERP",
      "Sign Out": "Bahaa",
      "Toggle Theme": "Dhaqna Jijjiiri",
      "Change Language": "Afaan Jijjiiri",
      "English": "Afaan Ingilizii",
      "Amharic": "Afaan Amaaraa",
      "Afaan Oromoo": "Afaan Oromoo",
      "Save": "Olkaa'i",
      "Cancel": "Haqi",
      "Edit": "Gulaali",
      "Delete": "Balleessi",
      "Add New": "Haaraa Dabali",
      "Create": "Uumi",
      "Submit": "Ergi",
      "Update": "Haaromsi",
      "Save Changes": "Jijjiiramoota Olkaa'i",
      "Ship Items": "Meeshaalee Ergi",
      "Print": "Maxxansi",
      "View Details": "Bal'ina Ilaali",
      "Back": "Gara Duubaa",
      "Manage Roles": "Gahee Bulchi",
      "Updating": "Haaromsaa jira...",
      "Add Item": "Meekaa Dabali",
      "Create Purchase Order": "Ajaja Bittaa Uumi",
      "Update Purchase Order": "Ajaja Bittaa Haaromsi",
      "Log Maintenance": "Suphaa Galmeessi",
      "Save Log": "Galmee Olkaa'i",
      "Track Shipment": "Fe'isa Hordofi",
      "Save Shipment": "Fe'isa Olkaa'i",
      "Save Recipe": "Akkaataa Hojii Olkaa'i",
      "Auto-Generate": "Ofiin Maddisiisi",
      "New Recipe": "Akkaataa Hojii Haaraa"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by waiting for client load
    return <div style={{ display: 'none' }}>{children}</div>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
