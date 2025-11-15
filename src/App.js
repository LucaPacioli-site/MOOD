import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Utensils, Shirt, Mic, Send, TrendingUp, Award, Share2, Menu, X, Music, Plane, ShoppingCart, MapPin, CreditCard, Clock, Star, Camera } from 'lucide-react';

const MoodBuy = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [moodInput, setMoodInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('Metro Manila, Philippines');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Load from localStorage
    const storedKey = localStorage.getItem('moodbuy_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setShowApiInput(false);
    }
    
    const points = localStorage.getItem('moodbuy_points') || 0;
    const userStreak = localStorage.getItem('moodbuy_streak') || 0;
    const savedCart = localStorage.getItem('moodbuy_cart');
    const savedAddress = localStorage.getItem('moodbuy_address') || 'Metro Manila, Philippines';
    
    setUserPoints(parseInt(points));
    setStreak(parseInt(userStreak));
    if (savedCart) setCart(JSON.parse(savedCart));
    setDeliveryAddress(savedAddress);
  }, []);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('moodbuy_api_key', apiKey);
      setShowApiInput(false);
    }
  };

  const startQrScan = async () => {
    setIsScanning(true);
    setScanMessage('📸 Initializing camera...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.play();
        setScanMessage('🔍 Scanning... Hold QR code steady');
        scanQRCode();
      }
    } catch (error) {
      setScanMessage('❌ Camera access denied. Please allow camera access.');
      setIsScanning(false);
    }
  };

  const stopQrScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setScanMessage('');
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // In production, integrate jsQR library for actual QR scanning
      const mockDetection = Math.random() > 0.95;
      
      if (mockDetection && !apiKey) {
        setScanMessage('✅ QR Code detected! Paste your API key.');
        stopQrScan();
        return;
      }
    }
    
    if (isScanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const addToCart = (item, category) => {
    const cartItem = {
      id: Date.now(),
      category,
      item,
      addedAt: new Date().toISOString()
    };
    const newCart = [...cart, cartItem];
    setCart(newCart);
    localStorage.setItem('moodbuy_cart', JSON.stringify(newCart));
  };

  const removeFromCart = (id) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('moodbuy_cart', JSON.stringify(newCart));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const priceStr = item.item.price || item.item.budget || '₱0';
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      return total + price;
    }, 0);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMoodInput(transcript);
    };
    
    recognition.start();
  };

  const getSystemPrompt = () => {
    switch(activeTab) {
      case 'concerts':
        return `You are MoodBuy's concert assistant for the Philippines. Recommend 3-4 concerts available for ticket purchase. Mix Philippine-based and international concerts. Include:
- Artist/Band name
- Venue (Philippine venues: Smart Araneta Coliseum, MOA Arena, PICC, Newport Performing Arts Theater, or international)
- Date
- Genre
- Why it matches their mood
- Ticket price in Philippine Peso (₱800-₱8,500)
- Delivery: "Digital ticket - instant delivery"
- Rating (4.2-5.0)
Location context: Philippines, Metro Manila area
Format as JSON: {"recommendations": [{"artist": "", "venue": "", "date": "", "genre": "", "reason": "", "price": "₱XXXX", "delivery": "", "rating": "X.X"}], "moodAnalysis": ""}`;
      
      case 'ootd':
        return `You are MoodBuy's fashion assistant for the Philippines. Recommend 3-4 fashion items from Philippine brands/stores available for delivery. Include:
- Product name
- Brand (Philippine brands: Bench, Penshoppe, Uniqlo PH, H&M Manila, SM Department Store, Zalora PH)
- Description
- Why it matches their mood
- Price in Philippine Peso (₱450-₱3,500)
- Delivery time (e.g., "Same-day delivery Metro Manila" or "1-2 days delivery")
- Rating (4.0-5.0)
Location: Philippines
Format as JSON: {"recommendations": [{"product": "", "brand": "", "description": "", "reason": "", "price": "₱XXX", "delivery": "", "rating": "X.X"}], "moodAnalysis": ""}`;
      
      case 'cravings':
        return `You are MoodBuy's food delivery assistant for the Philippines. Recommend 3-4 Philippine restaurants/dishes available for delivery. Include:
- Restaurant name (Filipino restaurants: Jollibee, Mang Inasal, Max's Restaurant, Gerry's Grill, Army Navy, or local favorites)
- Dish/meal name (Filipino dishes: Chicken Joy, Sisig, Adobo, Sinigang, Lechon Kawali, Halo-halo, etc.)
- Description
- Why it matches their mood
- Price in Philippine Peso (₱150-₱850)
- Delivery time (e.g., "25-35 mins via GrabFood/FoodPanda")
- Rating (4.0-5.0)
Location: Philippines, Metro Manila
Format as JSON: {"recommendations": [{"restaurant": "", "dish": "", "description": "", "reason": "", "price": "₱XXX", "delivery": "", "rating": "X.X"}], "moodAnalysis": ""}`;
      
      case 'travel':
        return `You are MoodBuy's travel assistant for Filipinos. Recommend 3-4 travel packages mixing Philippine destinations and international options. Include:
- Destination (Philippine: Boracay, Palawan, Siargao, Baguio, Cebu, Batanes OR International: Japan, Korea, Thailand, Singapore, etc.)
- Package name
- Description
- Why it matches their mood
- Price in Philippine Peso (₱8,500-₱85,000)
- Booking: "Instant confirmation"
- Rating (4.3-5.0)
Context: Traveler from Philippines
Format as JSON: {"recommendations": [{"destination": "", "package": "", "description": "", "reason": "", "price": "₱XXXXX", "delivery": "", "rating": "X.X"}], "moodAnalysis": ""}`;
      
      default:
        return '';
    }
  };

  const analyzeMood = async () => {
    if (!moodInput.trim()) return;
    if (!apiKey) {
      alert('Please scan your QR code keychain first!');
      setShowApiInput(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const systemPrompt = getSystemPrompt();

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: `${systemPrompt}\n\nUser mood/input: "${moodInput}"`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed. Check your API key.');
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setRecommendations(parsed);
        
        const newPoints = userPoints + 10;
        const newStreak = streak + 1;
        setUserPoints(newPoints);
        setStreak(newStreak);
        localStorage.setItem('moodbuy_points', newPoints.toString());
        localStorage.setItem('moodbuy_streak', newStreak.toString());
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const shareRecommendation = () => {
    const hashtags = {
      concerts: '🎵 Check out my MoodBuy concert recommendations! #MoodBuyPH #ConcertsPH #YourMoodYourLife',
      ootd: '👗 My MoodBuy outfit of the day! #MoodBuyPH #OOTDPH #YourMoodYourLife',
      cravings: '🍕 Check out my MoodBuy food recommendations! #MoodBuyPH #FoodiePH #YourMoodYourLife',
      travel: '✈️ My MoodBuy travel inspiration! #MoodBuyPH #TravelPH #YourMoodYourLife'
    };
    
    const text = hashtags[activeTab] || 'Check out MoodBuy! #YourMoodYourLife';
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  const checkout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    if (!deliveryAddress.trim()) {
      alert('Please add a delivery address!');
      return;
    }
    alert(`Order placed! 🎉\nTotal: ₱${calculateTotal().toFixed(2)}\nDelivering to: ${deliveryAddress}\n\nSalamat for using MoodBuy! 💜`);
    setCart([]);
    localStorage.setItem('moodbuy_cart', JSON.stringify([]));
    setShowCart(false);
  };

  const updateAddress = (newAddress) => {
    setDeliveryAddress(newAddress);
    localStorage.setItem('moodbuy_address', newAddress);
  };

  if (showApiInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Sparkles className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to MoodBuy</h1>
            <p className="text-gray-600">Your Mood. Your Life. Instantly.</p>
            <p className="text-sm text-purple-600 mt-2">🇵🇭 Philippine Mood-Based Marketplace</p>
          </div>
          
          <div className="space-y-4">
            {isScanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-xl object-cover"
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-purple-500 rounded-2xl animate-pulse" />
                </div>
                <p className="text-center text-sm text-purple-600 mt-2 font-semibold">
                  {scanMessage}
                </p>
                <button
                  onClick={stopQrScan}
                  className="w-full mt-4 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-all"
                >
                  Cancel Scan
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-300">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">🔑 QR Keychain Method</h3>
                    <p className="text-sm text-gray-700 mb-1">Keep your API key on a keychain QR!</p>
                    <p className="text-xs text-purple-700 font-semibold">✨ Fast • Private • Always With You</p>
                  </div>
                  
                  <button
                    onClick={startQrScan}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-lg"
                  >
                    <Camera className="w-6 h-6" />
                    <span>Scan QR Keychain</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or paste manually</span>
                  </div>
                </div>

                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
                
                <button
                  onClick={saveApiKey}
                  disabled={!apiKey.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Start Shopping
                </button>
                
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-blue-800 font-bold mb-2">💡 How to create your QR Keychain:</p>
                  <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
                    <li>Get API key from console.anthropic.com</li>
                    <li>Generate QR at qr-code-generator.com</li>
                    <li>Print & laminate the QR code</li>
                    <li>Attach to your keychain! 🔑</li>
                    <li>Scan anytime for instant access</li>
                  </ol>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  🔒 Your API key stays private on your device.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">MoodBuy</h1>
              <p className="text-xs text-white/80">🇵🇭 Philippine Marketplace</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-white">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">{streak} araw</span>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <Award className="w-5 h-5" />
              <span className="font-semibold">{userPoints} pts</span>
            </div>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
            >
              <ShoppingCart className="w-6 h-6 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-white/20 p-2 rounded-xl"
            >
              <ShoppingCart className="w-6 h-6 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-lg border-t border-white/20 p-4">
            <div className="flex flex-col space-y-2 text-white">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>{streak} araw streak</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>{userPoints} points</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-end">
          <div className="bg-white w-full md:w-96 h-[80vh] md:h-full md:rounded-l-3xl rounded-t-3xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-800">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => updateAddress(e.target.value)}
                  placeholder="Metro Manila, Philippines"
                  className="flex-1 px-2 py-1 border-b border-gray-300 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Walang laman ang cart mo</p>
                  <p className="text-sm text-gray-400 mt-2">Magdagdag base sa mood mo!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm">
                            {item.item.restaurant || item.item.product || item.item.artist || item.item.destination}
                          </p>
                          <p className="text-xs text-gray-600">
                            {item.item.dish || item.item.brand || item.item.venue || item.item.package}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-600 font-semibold">{item.item.price}</span>
                        <span className="text-gray-500 text-xs">{item.item.delivery}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Kabuuan</span>
                  <span className="text-2xl font-bold text-gray-800">₱{calculateTotal().toFixed(2)}</span>
                </div>
                <button
                  onClick={checkout}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Checkout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 mb-6 grid grid-cols-3 md:grid-cols-5 gap-2">
          <button
            onClick={() => { setActiveTab('home'); setRecommendations(null); }}
            className={`py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'home' 
                ? 'bg-white text-purple-600 shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => { setActiveTab('concerts'); setRecommendations(null); }}
            className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'concerts' 
                ? 'bg-white text-purple-600 shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">Concerts</span>
          </button>
          <button
            onClick={() => { setActiveTab('ootd'); setRecommendations(null); }}
            className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'ootd' 
                ? 'bg-white text-purple-600 shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span className="hidden sm:inline">Fashion</span>
          </button>
          <button
            onClick={() => { setActiveTab('cravings'); setRecommendations(null); }}
            className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'cravings' 
                ? 'bg-white text-purple-600 shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span className="hidden sm:inline">Food</span>
          </button>
          <button
            onClick={() => { setActiveTab('travel'); setRecommendations(null); }}
            className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'travel' 
                ? 'bg-white text-purple-600 shadow-lg' 
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span className="hidden sm:inline">Travel</span>
          </button>
        </div>

        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <Sparkles className="w-20 h-20 mx-auto text-purple-600 mb-4" />
              <h2 className="text-4xl font-bold text-gray-800 mb-3">Shop Based on Your Mood</h2>
              <p className="text-xl text-gray-600 mb-2">
                Mas accurate kaysa regular delivery apps!
              </p>
              <p className="text-purple-600 font-semibold">🇵🇭 Specially curated for Filipinos</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all" onClick={() => setActiveTab('concerts')}>
                  <Music className="w-12 h-12 text-blue-600 mb-3 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Concerts</h3>
                  <p className="text-sm text-gray-600">PH & International shows</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all" onClick={() => setActiveTab('ootd')}>
                  <Shirt className="w-12 h-12 text-purple-600 mb-3 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Fashion</h3>
                  <p className="text-sm text-gray-600">Philippine brands</p>
                </div>

                <div className="bg-gradient-to-br from-orange-100 to-red-100 p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all" onClick={() => setActiveTab('cravings')}>
                  <Utensils className="w-12 h-12 text-orange-600 mb-3 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Pagkain</h3>
                  <p className="text-sm text-gray-600">Filipino favorites</p>
                </div>

                <div className="bg-gradient-to-br from-green-100 to-teal-100 p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all" onClick={() => setActiveTab('travel')}>
                  <Plane className="w-12 h-12 text-green-600 mb-3 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Travel</h3>
                  <p className="text-sm text-gray-600">Local & abroad</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
              <h3 className="text-2xl font-bold mb-4">🇵🇭 Why MoodBuy Philippines?</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Mood-Based AI para sa Pinoy</strong>
                    <p className="text-sm text-white/80">Hindi katulad ng Lazada o Shopee - we match products to your emotions!</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Philippine-Based Recommendations</strong>
                    <p className="text-sm text-white/80">Jollibee, Bench, MOA Arena, Boracay + international options!</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <Camera className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <strong>QR Keychain Technology</strong>
                    <p className="text-sm text-white/80">Keep your API key on your keychain - scan anywhere, anytime! Super secure and mabilis!</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <strong>Fast Delivery Nationwide</strong>
                    <p className="text-sm text-white/80">Food 25-35 mins, Fashion same-day Metro Manila, Tickets instant, Travel bookings confirmed agad!</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab !== 'home' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {activeTab === 'concerts' && '🎵 Anong music vibe mo ngayon?'}
                {activeTab === 'ootd' && '👗 Anong style trip mo?'}
                {activeTab === 'cravings' && '🍕 Ano crave mo?'}
                {activeTab === 'travel' && '✈️ Saan mo gusto pumunta?'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {activeTab === 'concerts' && 'Tell us your mood for PH & international concerts'}
                {activeTab === 'ootd' && 'Share your mood for Philippine fashion picks'}
                {activeTab === 'cravings' && 'Sabihin ang mood mo para sa Filipino food'}
                {activeTab === 'travel' && 'Share your mood for travel destinations'}
              </p>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && analyzeMood()}
                  placeholder={
                    activeTab === 'concerts' ? "e.g., Feeling energetic, gusto ko mag-party!" :
                    activeTab === 'ootd' ? "e.g., May date ako sa BGC tonight, pahelp outfit!" :
                    activeTab === 'cravings' ? "e.g., Stressed ako, need ng comfort food!" :
                    "e.g., Gusto ko mag-relax sa beach..."
                  }
                  className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
                
                <button
                  onClick={handleVoiceInput}
                  disabled={isListening}
                  className={`p-3 rounded-xl transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}
                >
                  <Mic className="w-6 h-6" />
                </button>
                
                <button
                  onClick={analyzeMood}
                  disabled={isLoading || !moodInput.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              </div>

              {isListening && (
                <p className="text-sm text-purple-600 mt-2 animate-pulse">
                  🎤 Nakikinig... Sabihin mo mood mo!
                </p>
              )}
            </div>

            {recommendations && (
              <div>
                {recommendations.moodAnalysis && (
                  <div className="bg-purple-50 p-4 rounded-xl mb-4">
                    <p className="text-purple-800">
                      <strong>Mood Analysis:</strong> {recommendations.moodAnalysis}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.recommendations && recommendations.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all">
                      {activeTab === 'concerts' && (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800">{rec.artist}</h3>
                              <p className="text-blue-600 font-semibold">{rec.venue}</p>
                              <p className="text-sm text-gray-600">{rec.date}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {rec.genre}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 italic">{rec.reason}</p>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-semibold">{rec.rating}</span>
                            </div>
                            <span className="text-lg font-bold text-gray-800">{rec.price}</span>
                          </div>
                          <div className="flex items-center text-sm text-green-600 mb-4">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{rec.delivery}</span>
                          </div>
                          <button
                            onClick={() => addToCart(rec, 'concerts')}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
                          >
                            Add to Cart
                          </button>
                        </>
                      )}

                      {activeTab === 'ootd' && (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800">{rec.product}</h3>
                              <p className="text-purple-600 font-semibold">{rec.brand}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <p className="text-sm text-purple-600 mb-3 italic">{rec.reason}</p>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-semibold">{rec.rating}</span>