import React, { useState, useEffect } from 'react';
import logo from '../img.png';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Utensils, Clock, Flame, Search, Loader2, Store, AlertTriangle, CheckCircle2, ArrowRight, Play, X, ChevronRight, ChevronLeft, Leaf, Timer, Pause, RotateCcw, Crown, Star, Image as ImageIcon, User, LogOut, LogIn } from 'lucide-react';
import { GoogleAd } from "./Ad"

interface InstructionStep {
  text: string;
  timerMinutes: number | null;
}

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: InstructionStep[];
  prepTime: string;
  cookTime: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  estimatedCost: number;
}

interface MenuItem {
  name: string;
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  restaurantPrice: number;
  homeCookingPrice: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'restaurant' | 'idea'>('restaurant');
  const [restaurant, setRestaurant] = useState('');
  const [idea, setIdea] = useState('');
  const [isHealthyMode, setIsHealthyMode] = useState(false);
  
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [cookingStep, setCookingStep] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Premium & Ad State
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adTimeLeft, setAdTimeLeft] = useState(15);
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('yotaste_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsPremium(user.isPremium || false);
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authForm.email || !authForm.password || (authMode === 'register' && !authForm.name)) {
      setAuthError('Vyplňte prosím všechna pole.');
      return;
    }

    if (authMode === 'register') {
      const newUser: UserProfile = {
        id: Math.random().toString(36).substring(2, 9),
        name: authForm.name,
        email: authForm.email,
        isPremium: false,
      };
      localStorage.setItem('yotaste_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
      setIsPremium(false);
      setShowAuthModal(false);
    } else {
      // Fake login - just accept any email/password and create a mock user if it doesn't match a saved one perfectly
      // In a real app, we'd verify credentials against a backend
      const storedUserStr = localStorage.getItem('yotaste_user');
      let userToLogin: UserProfile;
      
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser.email === authForm.email) {
          userToLogin = storedUser;
        } else {
          userToLogin = { id: '1', name: authForm.email.split('@')[0], email: authForm.email, isPremium: false };
        }
      } else {
        userToLogin = { id: '1', name: authForm.email.split('@')[0], email: authForm.email, isPremium: false };
      }
      
      localStorage.setItem('yotaste_user', JSON.stringify(userToLogin));
      setCurrentUser(userToLogin);
      setIsPremium(userToLogin.isPremium);
      setShowAuthModal(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('yotaste_user');
    setCurrentUser(null);
    setIsPremium(false);
  };

  const handleBuyPremium = () => {
    setIsPremium(true);
    setShowPremiumModal(false);
    if (currentUser) {
      const updatedUser = { ...currentUser, isPremium: true };
      setCurrentUser(updatedUser);
      localStorage.setItem('yotaste_user', JSON.stringify(updatedUser));
    }
  };

  // Ad Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAdPlaying && adTimeLeft > 0) {
      interval = setInterval(() => {
        setAdTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isAdPlaying && adTimeLeft === 0) {
      setIsAdPlaying(false);
      if (pendingRecipe) {
        setRecipe(pendingRecipe);
        setPendingRecipe(null);
      }
    }
    return () => clearInterval(interval);
  }, [isAdPlaying, adTimeLeft, pendingRecipe]);

  // Timer Logic
  useEffect(() => {
    if (cookingStep !== null && recipe?.instructions[cookingStep]?.timerMinutes && recipe.instructions[cookingStep].timerMinutes! > 0) {
      setTimerSeconds(recipe.instructions[cookingStep].timerMinutes! * 60);
      setIsTimerRunning(false);
    } else {
      setTimerSeconds(null);
      setIsTimerRunning(false);
    }
  }, [cookingStep, recipe]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Optional: Play a sound here if needed
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFetchMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant.trim()) return;

    setLoadingMenu(true);
    setError(null);
    setRecipe(null);
    setMenu([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const healthyPrompt = isHealthyMode 
        ? "ZAMĚŘ SE PŘÍSNĚ NA ZDRAVÉ A DIETNÍ VARIANTY (nízkokalorické, fitness, PP, vysoký obsah bílkovin, minimum přidaného cukru a tuku). Vyber pouze ty nejlehčí a nejzdravější možnosti. Pokud restaurace nabízí těžká jídla, vyber jejich nejlehčí varianty nebo saláty." 
        : "";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Najdi co nejvíce reálných jídel z menu restaurace "${restaurant}" (ideálně 15-20 položek). ${healthyPrompt} Vrať POUZE JSON pole objektů. Každý objekt musí mít 'name' (název jídla česky), 'description' (velmi krátký a lákavý popis jídla česky), 'calories' (odhad kalorií, např. "450 kcal"), 'protein' (bílkoviny, např. "30g"), 'carbs' (sacharidy, např. "40g"), 'fat' (tuky, např. "15g"), 'fiber' (vláknina, např. "5g"). NAVÍC přidej 'restaurantPrice' (odhadovaná cena v restauraci v Kč jako číslo) a 'homeCookingPrice' (odhadovaná cena surovin pro domácí vaření v Kč jako číslo). Pokud restauraci neznáš, vymysli 15 typických jídel a realistické ceny.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                calories: { type: Type.STRING },
                protein: { type: Type.STRING },
                carbs: { type: Type.STRING },
                fat: { type: Type.STRING },
                fiber: { type: Type.STRING },
                restaurantPrice: { type: Type.NUMBER },
                homeCookingPrice: { type: Type.NUMBER }
              },
              required: ["name", "description", "calories", "protein", "carbs", "fat", "fiber", "restaurantPrice", "homeCookingPrice"]
            },
            description: "Seznam jídel z menu s makroživinami a cenami"
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      setMenu(data);
    } catch (err) {
      console.error(err);
      setError('Nepodařilo se načíst menu. Zkuste to prosím znovu.');
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleGenerateRecipe = async (dishName: string, sourceItem?: MenuItem) => {
    setLoadingRecipe(true);
    setError(null);
    setRecipe(null);
    
    // Scroll to recipe area
    setTimeout(() => {
      document.getElementById('recipe-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const healthyPrompt = isHealthyMode 
        ? "UPRAV RECEPT TAK, ABY BYL CO NEJZDRAVĚJŠÍ A NÍZKOKALORICKÝ (dietní verze, PP). Použij zdravější alternativy surovin (např. pečení místo smažení, méně tuku, celozrnné varianty, více bílkovin a vlákniny)." 
        : "";

      const macrosPrompt = sourceItem 
        ? `DŮLEŽITÉ: Musíš přesně zachovat tyto nutriční hodnoty a cenu: Kalorie: ${sourceItem.calories}, Bílkoviny: ${sourceItem.protein}, Sacharidy: ${sourceItem.carbs}, Tuky: ${sourceItem.fat}, Vláknina: ${sourceItem.fiber}, Cena (estimatedCost): ${sourceItem.homeCookingPrice}. Přizpůsob množství surovin tak, aby to odpovídalo.`
        : "";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Napiš detailní recept na jídlo "${dishName}". ${healthyPrompt} ${macrosPrompt} Vrať POUZE JSON objekt. Přidej také nutriční hodnoty (kalorie, bílkoviny, sacharidy, tuky, vláknina) a 'estimatedCost' (odhadovaná cena surovin na 1 porci v Kč jako číslo). U postupu (instructions) přidej 'timerMinutes' POUZE k těm krokům, kde je potřeba něco vařit, péct, smažit nebo čekat (pasivní čas). ZAKÁZÁNO přidávat timerMinutes k aktivním krokům jako je krájení, loupání, míchání, servírování - u těchto kroků klíč timerMinutes ZCELA VYNECH.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              prepTime: { type: Type.STRING },
              cookTime: { type: Type.STRING },
              calories: { type: Type.STRING },
              protein: { type: Type.STRING },
              carbs: { type: Type.STRING },
              fat: { type: Type.STRING },
              fiber: { type: Type.STRING },
              estimatedCost: { type: Type.NUMBER },
              ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              instructions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    timerMinutes: { 
                      type: Type.NUMBER, 
                      description: "Počet minut pro časovač. POUZE pro pasivní kroky (čekání, vaření, pečení). Pro aktivní kroky (krájení, míchání) tento klíč ZCELA VYNECH." 
                    }
                  },
                  required: ["text"]
                }
              }
            },
            required: ["title", "prepTime", "cookTime", "calories", "protein", "carbs", "fat", "fiber", "estimatedCost", "ingredients", "instructions"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (sourceItem) {
        data.calories = sourceItem.calories;
        data.protein = sourceItem.protein;
        data.carbs = sourceItem.carbs;
        data.fat = sourceItem.fat;
        data.fiber = sourceItem.fiber;
        data.estimatedCost = sourceItem.homeCookingPrice;
      }
      
      if (isPremium) {
        setRecipe(data);
      } else {
        setPendingRecipe(data);
        setAdTimeLeft(15);
        setIsAdPlaying(true);
      }
    } catch (err) {
      console.error(err);
      setError('Nepodařilo se vygenerovat recept. Zkuste to prosím znovu.');
    } finally {
      setLoadingRecipe(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F0EA] bg-[radial-gradient(#d6d3d1_1px,transparent_1px)] bg-[size:24px_24px] text-stone-900 font-sans selection:bg-[#c8f09d]">
      {/* Header - Brutalist/Editorial Style */}
      <header className="border-b-4 border-stone-900 bg-[#F4F0EA] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-28 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="YO, TASTE Logo" className="h-24 w-auto" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isPremium && (
              <button
                onClick={() => setShowPremiumModal(true)}
                className="bg-[#ffc837] text-stone-900 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-4 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] flex items-center gap-2 font-black transition-all"
              >
                <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline uppercase tracking-wider">Premium</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3 bg-white border-4 border-stone-900 rounded-xl p-2 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]">
                <div className="hidden sm:flex flex-col items-end px-2">
                  <span className="font-black text-sm uppercase leading-none">{currentUser.name}</span>
                  <span className="font-bold text-xs text-stone-500">{currentUser.isPremium ? 'Premium' : 'Free'}</span>
                </div>
                <div className="w-10 h-10 bg-stone-200 rounded-lg border-2 border-stone-900 flex items-center justify-center">
                  <User className="w-5 h-5 text-stone-600" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors border-2 border-transparent hover:border-stone-900"
                  title="Odhlásit se"
                >
                  <LogOut className="w-5 h-5 text-stone-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="bg-stone-900 text-white px-4 py-3 rounded-xl border-4 border-stone-900 shadow-[4px_4px_0px_0px_rgba(255,78,58,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(255,78,58,1)] flex items-center gap-2 font-black transition-all uppercase tracking-wider"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">Přihlásit se</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-none">
            <span className="text-stone-900">CO BUDEME</span><br/>
            <span className="text-[#ff4e3a]">VAŘIT?</span>
          </h1>
          <p className="text-lg sm:text-xl text-stone-600 font-medium max-w-2xl mx-auto">
            Vyberte si jídlo z vaší oblíbené restaurace, nebo nám řekněte, na co máte chuť. My se postaráme o zbytek.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`px-8 py-4 rounded-xl font-black uppercase tracking-wider border-2 border-stone-900 transition-all ${
              activeTab === 'restaurant' 
                ? 'bg-[#ffc837] shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] translate-y-0' 
                : 'bg-white hover:bg-stone-50 shadow-none opacity-70'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <Store className="w-5 h-5" />
              Hledat z restaurace
            </div>
          </button>
          <button
            onClick={() => setActiveTab('idea')}
            className={`px-8 py-4 rounded-xl font-black uppercase tracking-wider border-2 border-stone-900 transition-all ${
              activeTab === 'idea' 
                ? 'bg-[#ffc837] shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] translate-y-0' 
                : 'bg-white hover:bg-stone-50 shadow-none opacity-70'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <Utensils className="w-5 h-5" />
              Vím, co chci vařit
            </div>
          </button>
        </div>

        {/* Input Forms */}
        <div className="max-w-3xl mx-auto mb-16">
          {activeTab === 'restaurant' ? (
            <form onSubmit={handleFetchMenu} className="relative">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400" />
                  <input
                    type="text"
                    value={restaurant}
                    onChange={(e) => setRestaurant(e.target.value)}
                    placeholder="Např. Lokál, Ambiente, McDonald's..."
                    className="w-full pl-14 pr-6 py-5 rounded-xl border-2 border-stone-900 bg-white text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[#ffc837]/50 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] placeholder:font-normal"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingMenu}
                  className="bg-[#ff4e3a] text-white px-8 py-5 rounded-xl font-black uppercase tracking-wider border-2 border-stone-900 hover:bg-[#e03e2a] transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] shrink-0"
                >
                  {loadingMenu ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Ukázat menu'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if(idea.trim()) handleGenerateRecipe(idea); }} className="relative">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Utensils className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400" />
                  <input
                    type="text"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Např. Svíčková na smetaně, Pad Thai..."
                    className="w-full pl-14 pr-6 py-5 rounded-xl border-2 border-stone-900 bg-white text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[#ffc837]/50 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] placeholder:font-normal"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingRecipe}
                  className="bg-[#ff4e3a] text-white px-8 py-5 rounded-xl font-black uppercase tracking-wider border-2 border-stone-900 hover:bg-[#e03e2a] transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] shrink-0"
                >
                  {loadingRecipe ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Recept'}
                </button>
              </div>
            </form>
          )}

          {/* Healthy Mode Toggle */}
          <div className="mt-6 flex justify-center">
            <button 
              type="button"
              onClick={() => setIsHealthyMode(!isHealthyMode)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-stone-900 font-black text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] ${
                isHealthyMode ? 'bg-[#c8f09d] text-stone-900' : 'bg-white text-stone-500'
              }`}
            >
              <Leaf className={`w-5 h-5 ${isHealthyMode ? 'text-green-600' : 'text-stone-400'}`} />
              {isHealthyMode ? 'DIETNÍ VERZE (ZAPNUTO)' : 'UDĚLAT DIETNÍ VERZI'}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-12 bg-red-50 border-2 border-red-500 text-red-700 p-6 rounded-xl flex items-center gap-4 font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Menu Grid */}
        {menu.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-8 border-b-4 border-stone-900 pb-4">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Menu: {restaurant}</h2>
              <span className="bg-stone-900 text-white px-4 py-1 rounded-full font-bold text-sm">
                {menu.length} položek
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menu.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={index}
                  onClick={() => handleGenerateRecipe(item.name, item)}
                  className="bg-white border-4 border-stone-900 p-6 sm:p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] hover:translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
                >
                  {/* Decorative shape */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#ffc837] rounded-full border-4 border-stone-900 opacity-20 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 z-0"></div>
                  
                  <div className="flex-1 relative z-10">
                    <h3 className="font-black text-2xl sm:text-3xl leading-tight group-hover:text-[#ff4e3a] transition-colors mb-4">{item.name}</h3>
                    <p className="text-stone-600 font-medium mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">{item.description}</p>
                  </div>
                  <div className="flex flex-col gap-4 mt-auto pt-6 border-t-4 border-stone-900 relative z-10">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-stone-500">V restauraci:</span>
                        <span className="text-lg">{item.restaurantPrice} Kč</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-stone-500">Doma uvaříš za:</span>
                        <span className="text-lg text-green-600">{item.homeCookingPrice} Kč</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black bg-[#c8f09d] px-3 py-2 rounded-lg border-2 border-stone-900">
                        <span>Ušetříš:</span>
                        <span>{item.restaurantPrice - item.homeCookingPrice} Kč</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-[#c8f09d] text-stone-900 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]">
                        🔥 {item.calories}
                      </span>
                      <span className="bg-white text-stone-900 text-xs font-bold px-2 py-1.5 rounded-lg border-2 border-stone-900">
                        B: {item.protein}
                      </span>
                      <span className="bg-white text-stone-900 text-xs font-bold px-2 py-1.5 rounded-lg border-2 border-stone-900">
                        S: {item.carbs}
                      </span>
                      <span className="bg-white text-stone-900 text-xs font-bold px-2 py-1.5 rounded-lg border-2 border-stone-900">
                        T: {item.fat}
                      </span>
                      <span className="bg-white text-stone-900 text-xs font-bold px-2 py-1.5 rounded-lg border-2 border-stone-900">
                        V: {item.fiber}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <div className="w-12 h-12 rounded-xl border-4 border-stone-900 flex items-center justify-center bg-stone-50 group-hover:bg-[#ff4e3a] group-hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recipe Loading State */}
        {loadingRecipe && (
          <div id="recipe-section" className="py-20 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-[#ff4e3a]" />
            <p className="text-xl font-bold uppercase tracking-wider">Připravuji recept...</p>
          </div>
        )}

        {/* Recipe Display */}
        {recipe && !loadingRecipe && (
          <motion.div
            id="recipe-section"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white border-4 border-stone-900 rounded-3xl shadow-[12px_12px_0px_0px_rgba(28,25,23,1)] overflow-hidden">
              <div className="p-6 sm:p-8 md:p-12 border-b-4 border-stone-900 bg-[#ffc837]">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6 sm:mb-8 leading-none">
                  {recipe.title}
                </h2>
                
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 bg-white px-4 py-2 sm:px-5 sm:py-3 rounded-xl border-2 border-stone-900 font-bold shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] text-sm sm:text-base">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff4e3a]" />
                    <span>Příprava: {recipe.prepTime}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-white px-4 py-2 sm:px-5 sm:py-3 rounded-xl border-2 border-stone-900 font-bold shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] text-sm sm:text-base">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff4e3a]" />
                    <span>Vaření: {recipe.cookTime}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-[#c8f09d] px-4 py-2 sm:px-5 sm:py-3 rounded-xl border-2 border-stone-900 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] text-sm sm:text-base">
                    <span>🔥 {recipe.calories}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-white px-4 py-2 sm:px-5 sm:py-3 rounded-xl border-2 border-stone-900 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] text-sm sm:text-base">
                    <span>💰 Cena: ~{recipe.estimatedCost} Kč</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="bg-white px-4 py-2 rounded-lg border-2 border-stone-900 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]">
                    Bílkoviny: {recipe.protein}
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border-2 border-stone-900 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]">
                    Sacharidy: {recipe.carbs}
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border-2 border-stone-900 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]">
                    Tuky: {recipe.fat}
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border-2 border-stone-900 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]">
                    Vláknina: {recipe.fiber}
                  </div>
                </div>
                
                <button 
                  onClick={() => setCookingStep(0)}
                  className="mt-8 bg-stone-900 text-white px-8 py-5 rounded-xl font-black uppercase tracking-wider hover:bg-stone-800 transition-colors flex items-center justify-center gap-3 text-lg w-full sm:w-auto shadow-[4px_4px_0px_0px_rgba(255,78,58,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(255,78,58,1)]"
                >
                  <Play className="w-6 h-6 fill-white" />
                  Začít vařit krok za krokem
                </button>
              </div>

              <div className="p-6 sm:p-8 md:p-12 grid md:grid-cols-3 gap-8 lg:gap-12">
                <div className="md:col-span-1">
                  <h3 className="text-2xl font-black uppercase tracking-wider mb-6 flex items-center gap-3 border-b-4 border-stone-900 pb-2">
                    <Utensils className="w-6 h-6" /> Suroviny
                  </h3>
                  <ul className="space-y-4">
                    {recipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start gap-3 font-medium text-lg">
                        <div className="w-2 h-2 rounded-full bg-[#ff4e3a] mt-2.5 shrink-0" />
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-black uppercase tracking-wider mb-6 flex items-center gap-3 border-b-4 border-stone-900 pb-2">
                    <ChefHat className="w-6 h-6" /> Postup
                  </h3>
                  <div className="space-y-8">
                    {recipe.instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-6">
                        <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-black flex items-center justify-center shrink-0 text-xl shadow-[2px_2px_0px_0px_rgba(255,78,58,1)]">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-lg font-medium leading-relaxed">{step.text}</p>
                          {!!step.timerMinutes && step.timerMinutes > 0 && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border-2 border-stone-900 font-bold text-sm">
                              <Timer className="w-4 h-4" />
                              Časovač: {step.timerMinutes} min
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cooking Step-by-step Modal */}
        <AnimatePresence>
          {cookingStep !== null && recipe && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-0 z-50 bg-[#F4F0EA] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b-4 border-stone-900 bg-white">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter truncate pr-4">{recipe.title}</h2>
                <button onClick={() => setCookingStep(null)} className="p-2 sm:p-3 bg-stone-100 border-2 border-stone-900 rounded-xl hover:bg-stone-200 transition-colors shrink-0 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]">
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-stone-900" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto w-full text-center overflow-y-auto">
                <span className="text-stone-900 font-black text-lg sm:text-xl mb-6 sm:mb-8 uppercase tracking-widest bg-[#ffc837] px-4 sm:px-6 py-2 rounded-xl border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]">
                  Krok {cookingStep + 1} z {recipe.instructions.length}
                </span>
                <p className="text-2xl sm:text-4xl md:text-5xl font-black text-stone-900 leading-tight">
                  {recipe.instructions[cookingStep].text}
                </p>

                {/* Interactive Timer UI */}
                {!!recipe.instructions[cookingStep].timerMinutes && recipe.instructions[cookingStep].timerMinutes! > 0 && (
                  <div className="mt-8 sm:mt-12 p-6 sm:p-8 border-4 border-stone-900 rounded-3xl bg-white shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] flex flex-col items-center w-full max-w-md">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 text-stone-500 font-bold uppercase tracking-wider text-sm sm:text-base">
                      <Timer className="w-5 h-5 sm:w-6 sm:h-6" /> Časovač
                    </div>
                    <div className={`text-6xl sm:text-8xl font-mono font-black mb-6 sm:mb-8 tracking-tighter ${timerSeconds === 0 ? 'text-[#ff4e3a] animate-pulse' : 'text-stone-900'}`}>
                      {formatTime(timerSeconds || 0)}
                    </div>
                    
                    <div className="flex flex-col gap-4 w-full">
                      {!isTimerRunning && timerSeconds === recipe.instructions[cookingStep].timerMinutes! * 60 ? (
                        <button
                          onClick={() => setIsTimerRunning(true)}
                          className="w-full flex flex-col items-center justify-center gap-1 py-4 sm:py-5 border-4 border-stone-900 rounded-2xl font-black uppercase tracking-wider transition-all shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] bg-[#c8f09d]"
                        >
                          <span className="flex items-center gap-2 text-lg sm:text-xl"><Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> TEĎ! (Spustit)</span>
                          <span className="text-[10px] sm:text-xs opacity-70 normal-case font-bold">Klikněte, jakmile vložíte do hrnce/trouby</span>
                        </button>
                      ) : (
                        <div className="flex gap-3 sm:gap-4 w-full">
                          <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 border-4 border-stone-900 rounded-xl font-black uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] text-sm sm:text-base ${
                              isTimerRunning ? 'bg-[#ffc837]' : 'bg-[#c8f09d]'
                            }`}
                          >
                            {isTimerRunning ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
                            {isTimerRunning ? 'Pozastavit' : 'Pokračovat'}
                          </button>
                          <button
                            onClick={() => {
                              setIsTimerRunning(false);
                              setTimerSeconds(recipe.instructions[cookingStep].timerMinutes! * 60);
                            }}
                            className="px-4 py-3 sm:px-6 sm:py-4 bg-stone-200 border-4 border-stone-900 rounded-xl font-black uppercase tracking-wider hover:bg-stone-300 transition-all shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]"
                            title="Resetovat časovač"
                          >
                            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 sm:p-6 md:p-8 border-t-4 border-stone-900 bg-white flex items-center justify-between gap-2">
                <button 
                  onClick={() => setCookingStep(Math.max(0, cookingStep - 1))}
                  disabled={cookingStep === 0}
                  className="px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-black uppercase tracking-wider text-stone-900 border-2 border-stone-900 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-2 transition-all shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] disabled:shadow-none text-sm sm:text-base"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="hidden sm:inline">Předchozí</span>
                </button>
                
                {cookingStep < recipe.instructions.length - 1 ? (
                  <button 
                    onClick={() => setCookingStep(cookingStep + 1)}
                    className="px-4 py-3 sm:px-8 sm:py-4 bg-[#ff4e3a] text-white rounded-xl font-black uppercase tracking-wider border-2 border-stone-900 hover:bg-[#e03e2a] flex items-center gap-2 transition-all shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] text-sm sm:text-base"
                  >
                    Další krok <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setCookingStep(null)}
                    className="px-4 py-3 sm:px-8 sm:py-4 bg-[#c8f09d] text-stone-900 rounded-xl font-black uppercase tracking-wider border-2 border-stone-900 hover:bg-[#b3d98c] flex items-center gap-2 transition-all shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] text-sm sm:text-base"
                  >
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> Dokončit
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Premium Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#f4f0ea] border-4 border-stone-900 rounded-3xl shadow-[16px_16px_0px_0px_rgba(28,25,23,1)] w-full max-w-md overflow-hidden flex flex-col relative"
            >
              <button 
                onClick={() => setShowPremiumModal(false)} 
                className="absolute top-4 right-4 hover:bg-black/10 p-2 rounded-xl transition-colors border-2 border-transparent hover:border-stone-900 z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="p-8 text-center bg-[#ffc837] border-b-4 border-stone-900">
                <Crown className="w-16 h-16 mx-auto mb-4 text-stone-900" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">Premium</h2>
                <p className="font-bold text-stone-700 mt-2">Vařte bez otravných reklam!</p>
              </div>
              <div className="p-8 space-y-6">
                <ul className="space-y-4 font-bold text-lg">
                  <li className="flex items-center gap-3"><CheckCircle2 className="text-[#ff4e3a]" /> Žádné 15s reklamy</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="text-[#ff4e3a]" /> Okamžité zobrazení receptů</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="text-[#ff4e3a]" /> Podpora vývojářů</li>
                </ul>
                <div className="bg-white p-4 rounded-xl border-4 border-stone-900 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#ff4e3a] text-white font-black text-xs px-3 py-1 uppercase tracking-wider transform translate-x-2 -translate-y-1 rotate-12">
                    Akce!
                  </div>
                  <div className="text-sm font-bold text-stone-500 line-through">150 Kč / měsíc</div>
                  <div className="text-4xl font-black text-stone-900 my-1">99 Kč</div>
                  <div className="text-sm font-bold text-[#ff4e3a] uppercase tracking-wider">první měsíc!</div>
                </div>
                <button 
                  onClick={handleBuyPremium}
                  className="w-full bg-stone-900 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-stone-800 transition-colors shadow-[4px_4px_0px_0px_rgba(255,78,58,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(255,78,58,1)]"
                >
                  Koupit Premium
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white border-4 border-stone-900 rounded-3xl shadow-[16px_16px_0px_0px_rgba(28,25,23,1)] w-full max-w-md overflow-hidden flex flex-col relative"
            >
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="absolute top-4 right-4 hover:bg-stone-100 p-2 rounded-xl transition-colors border-2 border-transparent hover:border-stone-900 z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="p-8 text-center bg-stone-100 border-b-4 border-stone-900">
                <div className="w-16 h-16 bg-stone-900 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">
                  {authMode === 'login' ? 'Přihlášení' : 'Registrace'}
                </h2>
              </div>
              <div className="p-8">
                {authError && (
                  <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {authError}
                  </div>
                )}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-sm font-black uppercase tracking-wider mb-2">Jméno</label>
                      <input
                        type="text"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-stone-900 bg-stone-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffc837]/50 font-medium transition-all"
                        placeholder="Vaše jméno"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-black uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-900 bg-stone-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffc837]/50 font-medium transition-all"
                      placeholder="vas@email.cz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black uppercase tracking-wider mb-2">Heslo</label>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-900 bg-stone-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffc837]/50 font-medium transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-[#ff4e3a] text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-[#e03e2a] transition-colors shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] mt-4 border-2 border-stone-900"
                  >
                    {authMode === 'login' ? 'Přihlásit se' : 'Zaregistrovat se'}
                  </button>
                </form>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthError('');
                    }}
                    className="text-stone-500 hover:text-stone-900 font-bold underline decoration-2 underline-offset-4 transition-colors"
                  >
                    {authMode === 'login' ? 'Nemáte účet? Zaregistrujte se' : 'Již máte účet? Přihlaste se'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ad Modal */}
      <AnimatePresence>
        {/* Show Ad for free users before recipe */}
        {isAdPlaying && pendingRecipe && !isPremium && (
            <div className="max-w-4xl mx-auto bg-white border-4 border-stone-900 rounded-3xl shadow-[12px_12px_0px_0px_rgba(28,25,23,1)] p-8 text-center">
              <p className="mb-4 font-bold text-lg">Recept se načte po 15s reklamě</p>
              <p className="mb-6 font-medium text-stone-500">{adTimeLeft} s</p>
              <GoogleAd />
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
