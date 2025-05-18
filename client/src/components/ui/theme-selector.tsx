import { useEffect, useState } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";

type ThemeOption = {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  cardBg: string;
  textColor: string;
};

const defaultThemes: ThemeOption[] = [
  {
    name: "Jellyfin Default",
    primary: "rgb(82, 47, 178)",
    secondary: "rgb(60, 35, 131)",
    background: "linear-gradient(to bottom, #0a0d14, #121725)",
    cardBg: "rgba(17, 24, 39, 0.4)",
    textColor: "#ffffff"
  },
  {
    name: "Ocean Blue",
    primary: "rgb(37, 99, 235)",
    secondary: "rgb(29, 78, 216)",
    background: "linear-gradient(to bottom, #0c1929, #0d2744)",
    cardBg: "rgba(15, 23, 42, 0.4)",
    textColor: "#ffffff"
  },
  {
    name: "Emerald",
    primary: "rgb(16, 185, 129)",
    secondary: "rgb(5, 150, 105)",
    background: "linear-gradient(to bottom, #0c1f1a, #0f291f)",
    cardBg: "rgba(17, 38, 34, 0.4)",
    textColor: "#ffffff"
  },
  {
    name: "Ruby",
    primary: "rgb(220, 38, 38)",
    secondary: "rgb(185, 28, 28)",
    background: "linear-gradient(to bottom, #1c0807, #290f0a)",
    cardBg: "rgba(41, 17, 15, 0.4)",
    textColor: "#ffffff"
  },
  {
    name: "Dark Mode",
    primary: "rgb(107, 114, 128)",
    secondary: "rgb(75, 85, 99)",
    background: "linear-gradient(to bottom, #0a0a0a, #1a1a1a)",
    cardBg: "rgba(24, 24, 27, 0.4)",
    textColor: "#ffffff"
  }
];

export function ThemeSelector() {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(defaultThemes[0]);

  useEffect(() => {
    // Get theme from localStorage or use default
    const savedTheme = localStorage.getItem("jellyfin-signup-theme");
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setSelectedTheme(parsed);
        applyTheme(parsed);
      } catch (e) {
        console.error("Error parsing saved theme:", e);
        // If there's an error, use default theme
        applyTheme(defaultThemes[0]);
      }
    } else {
      // No saved theme, use default
      applyTheme(defaultThemes[0]);
    }
  }, []);

  const applyTheme = (theme: ThemeOption) => {
    // Apply the theme CSS variables
    document.documentElement.style.setProperty('--theme-primary', theme.primary);
    document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
    document.documentElement.style.setProperty('--theme-background', theme.background);
    document.documentElement.style.setProperty('--theme-card-bg', theme.cardBg);
    document.documentElement.style.setProperty('--theme-text', theme.textColor);
    
    // Update the body background
    document.body.style.background = theme.background;
    
    // Save to localStorage
    localStorage.setItem("jellyfin-signup-theme", JSON.stringify(theme));
  };

  const selectTheme = (theme: ThemeOption) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    setOpen(false);
  };

  return (
    <div className="theme-selector">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between bg-gray-900/60 border-gray-700 hover:bg-gray-800 hover:text-white text-sm"
          >
            <Palette className="mr-2 h-4 w-4" />
            {selectedTheme.name}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[220px] bg-gray-900 border-gray-700">
          <Command className="bg-transparent">
            <CommandInput placeholder="Search themes..." className="border-b border-gray-700 focus:ring-0 bg-gray-900 text-white h-9 placeholder-gray-400" />
            <CommandList>
              <CommandEmpty>No themes found.</CommandEmpty>
              <CommandGroup>
                {defaultThemes.map((theme) => (
                  <CommandItem
                    key={theme.name}
                    onSelect={() => selectTheme(theme)}
                    className="hover:bg-gray-800 text-gray-300 aria-selected:text-white aria-selected:bg-gray-800"
                  >
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ background: theme.primary }}
                    />
                    {theme.name}
                    {selectedTheme.name === theme.name && (
                      <Check className="ml-auto h-4 w-4 text-green-500" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}