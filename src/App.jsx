import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Bell, BellOff, Gift, Plus, Trash2, Copy, Edit, 
  X, Image as ImageIcon, User, Music, ChevronDown, Loader, AlertTriangle,
  Shuffle, Wand2, Settings, Upload, Monitor, Smartphone
} from 'lucide-react';

const ASSET_CONFIG = {
  defaultAudio: "background-music.mp3", 
  defaultBgDesktop: "/images/bg-desktop.avif", 
  defaultBgMobile: "/images/bg-mobile.avif"   
};

// --- MAPPING GIF NGƯỜI TẶNG ---
// Đảm bảo bạn đã có các file này trong thư mục public/gif/
const GIVER_GIF_MAP = {
  'Nghiệp': '/gif/nghiep.gif',
  'Hiếu': '/gif/hieu.gif',
  'An': '/gif/an.gif'
};

// --- INDEXED DB HELPER ---
const DB_NAME = 'ChristmasWheelDB';
const STORE_NAME = 'gifts';
const DB_VERSION = 1;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const getGiftsFromDB = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("DB Error", e);
    return [];
  }
};

const saveGiftToDB = async (gift) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(gift);
    return tx.complete;
  } catch (e) {
    console.error("Error saving to DB", e);
    throw e;
  }
};

const deleteGiftFromDB = async (id) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    return tx.complete;
  } catch (e) {
    console.error("Error deleting from DB", e);
  }
};

const clearDB = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return tx.complete;
  } catch (e) {
    console.error("Error clearing DB", e);
  }
};

// --- CONSTANTS & CONFIG ---
const COLORS = ['#D42426', '#165B33', '#F8B229']; // Red, Green, Gold
const VIETNAMESE_ALPHABET = [
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 
  'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 
  'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V'
]; // 27 letters exactly
const GIVERS_27 = ['Nghiệp', 'Hiếu', 'An'];

const BG_PRESETS = [
  { name: 'Xanh Lá', value: 'radial-gradient(circle at center, #1a472a 0%, #0d2114 100%)' },
  { name: 'Đỏ Noel', value: 'radial-gradient(circle at center, #8b0000 0%, #2b0505 100%)' },
  { name: 'Tím Đêm', value: 'radial-gradient(circle at center, #2e003e 0%, #0d001a 100%)' },
  { name: 'Xanh Tuyết', value: 'radial-gradient(circle at center, #004e92 0%, #000428 100%)' },
];

const I18N = {
  vi: {
    spin: "QUAY",
    giftList: "Kho Quà",
    itemsLeft: "phần quà",
    add: "Thêm quà",
    update: "Cập nhật",
    cancel: "Hủy",
    emptyList: "Kho quà đang trống!",
    congrats: "CHÚC MỪNG!",
    closeKeep: "Đóng & Giữ",
    confirmRemove: "Nhận & Xóa",
    toastEmpty: "Đã trao hết quà 🎄",
    toastAdded: "Đã thêm quà mới",
    toastUpdated: "Đã cập nhật quà",
    toastCopied: "Đã nhân bản quà",
    toastShuffled: "Đã trộn vị trí quà",
    toastGenerated: "Đã tạo 27 quà mẫu",
    toastErrorStorage: "Lỗi: File quá lớn hoặc ổ cứng đầy!",
    toastFileTooBig: "Cảnh báo: File > 100MB có thể gây lag!",
    loadSample: "Nạp dữ liệu mẫu",
    placeholderGift: "Tên quà",
    placeholderGiver: "Người tặng",
    uploadLabel: "GIF/Ảnh (Max 100MB)",
    giverLabel: "Người tặng",
    shuffle: "Trộn quà",
    gen27: "Tạo 27 quà (ABC...)",
    settings: "Cài đặt",
    bgLabel: "Hình nền",
    uploadBgDesktop: "Ảnh nền PC",
    uploadBgMobile: "Ảnh nền ĐT"
  },
  en: {
    spin: "SPIN",
    giftList: "Gift List",
    itemsLeft: "items left",
    add: "Add Gift",
    update: "Update",
    cancel: "Cancel",
    emptyList: "Gift list is empty!",
    congrats: "CONGRATS!",
    closeKeep: "Close & Keep",
    confirmRemove: "Claim & Remove",
    toastEmpty: "No gifts left 🎄",
    toastAdded: "Gift added",
    toastUpdated: "Gift updated",
    toastCopied: "Gift copied",
    toastShuffled: "Gifts shuffled",
    toastGenerated: "Generated 27 sample gifts",
    toastErrorStorage: "Storage Error: File too big!",
    toastFileTooBig: "Warning: File > 100MB may cause lag!",
    loadSample: "Load Sample Data",
    placeholderGift: "Gift Name",
    placeholderGiver: "Giver Name",
    uploadLabel: "GIF/Img (Max 100MB)",
    giverLabel: "Giver",
    shuffle: "Shuffle",
    gen27: "Gen 27 Gifts",
    settings: "Settings",
    bgLabel: "Background",
    uploadBgDesktop: "PC Background",
    uploadBgMobile: "Mobile Background"
  },
  cn: {
    spin: "旋转",
    giftList: "礼物清单",
    itemsLeft: "剩余",
    add: "添加礼物",
    update: "更新",
    cancel: "取消",
    emptyList: "礼物清单是空的!",
    congrats: "恭喜!",
    closeKeep: "关闭并保留",
    confirmRemove: "领取并移除",
    toastEmpty: "礼物已送完 🎄",
    toastAdded: "已添加礼物",
    toastUpdated: "礼物已更新",
    toastCopied: "礼物已复制",
    toastShuffled: "礼物已洗牌",
    toastGenerated: "已生成 27 个示例礼物",
    toastErrorStorage: "存储错误！",
    toastFileTooBig: "警告：文件 > 100MB 可能会导致卡顿！",
    loadSample: "加载示例数据",
    placeholderGift: "礼物名称",
    placeholderGiver: "送礼人",
    uploadLabel: "图片",
    giverLabel: "送礼人",
    shuffle: "洗牌",
    gen27: "生成 27 礼物",
    settings: "设置",
    bgLabel: "背景",
    uploadBgDesktop: "电脑背景",
    uploadBgMobile: "手机背景"
  }
};

// --- HELPER TO RENDER BLOB OR URL ---
const useObjectUrl = (fileOrUrl) => {
  const [url, setUrl] = useState(null);
  
  useEffect(() => {
    let objectUrl = null;
    if (fileOrUrl instanceof Blob || fileOrUrl instanceof File) {
      objectUrl = URL.createObjectURL(fileOrUrl);
      setUrl(objectUrl);
    } else {
      setUrl(fileOrUrl);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileOrUrl]);

  return url;
};

// Component to render image safely from Blob
const SafeImage = ({ src, className, alt, style }) => {
  const url = useObjectUrl(src);
  if (!url) return null;
  return <img src={url} className={className} alt={alt} style={style} />;
};

// --- SNOWFALL COMPONENT (IMPROVED - DENSER) ---
const SnowFall = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createFlake = () => {
      const flake = document.createElement('div');
      flake.className = 'snowflake';
      flake.innerText = ['❄', '❅', '❆', '•'][Math.floor(Math.random() * 4)];
      
      // Random properties for natural look
      const startLeft = Math.random() * 100;
      const size = Math.random() * 15 + 10; // Bigger: 10px to 25px
      const duration = Math.random() * 5 + 5; // Slower: 5s to 10s
      const opacity = Math.random() * 0.5 + 0.3;

      flake.style.left = `${startLeft}vw`;
      flake.style.fontSize = `${size}px`;
      flake.style.opacity = opacity;
      flake.style.animationDuration = `${duration}s`;
      
      container.appendChild(flake);
      
      // Remove flake after animation to prevent memory leak
      setTimeout(() => {
        if (flake.parentNode === container) {
          container.removeChild(flake);
        }
      }, duration * 1000);
    };

    // Create flakes MUCH more frequently (50ms instead of 200ms) for denser snow
    const interval = setInterval(createFlake, 50); 

    return () => clearInterval(interval);
  }, []);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[5] overflow-hidden" />;
};

// --- MAIN COMPONENT ---
export default function App() {
  const [lang, setLang] = useState('vi');
  const [gifts, setGifts] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState({ msg: '', visible: false });
  const [isLoading, setIsLoading] = useState(true);
  
  // Background State
  // SỬA LỖI: Ưu tiên ảnh config nếu có, nếu không thì dùng gradient mặc định
  const [bgStyle, setBgStyle] = useState(
    (ASSET_CONFIG.defaultBgDesktop || ASSET_CONFIG.defaultBgMobile) ? null : BG_PRESETS[0].value
  );
  
  const [bgImageDesktop, setBgImageDesktop] = useState(ASSET_CONFIG.defaultBgDesktop); 
  const [bgImageMobile, setBgImageMobile] = useState(ASSET_CONFIG.defaultBgMobile);

  const [editId, setEditId] = useState(null);
  const [inputName, setInputName] = useState('');
  const [inputGiver, setInputGiver] = useState('');
  const [inputImage, setInputImage] = useState(null);

  const canvasRef = useRef(null);
  const wheelContainerRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const angleRef = useRef(0);
  const isSpinningRef = useRef(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const savedGifts = await getGiftsFromDB();
      if (savedGifts && savedGifts.length > 0) {
        setGifts(savedGifts);
      }
      setIsLoading(false);
    };
    initData();

    const link = document.createElement('link');
    link.href = "https://fonts.googleapis.com/css2?family=Mali:wght@400;600;700&family=ZCOOL+KuaiLe&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    if (audioRef.current) audioRef.current.volume = 0.3;

    return () => {
      document.head.removeChild(link);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) drawWheel();
  }, [gifts, lang, isLoading]);

  // --- HELPERS ---
  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const playTick = () => {
    if (!isSoundOn) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playWinSound = () => {
    if (!isSoundOn) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 1.5);
    });
  };

  // --- WHEEL DRAWING ---
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = wheelContainerRef.current;
    const size = container ? container.offsetWidth : 300;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = size / 2 - 10;
    const total = gifts.length;

    ctx.clearRect(0, 0, size, size);
    const fontFamily = lang === 'cn' ? '"ZCOOL KuaiLe", cursive' : '"Mali", cursive';

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      ctx.font = `bold ${size/15}px ${fontFamily}`;
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("EMPTY", center, center);
      return;
    }

    const arcSize = (2 * Math.PI) / total;
    const currentRot = angleRef.current * (Math.PI / 180);

    for (let i = 0; i < total; i++) {
      const angle = currentRot + i * arcSize;
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arcSize);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(12, size/24)}px ${fontFamily}`;
      let text = gifts[i].name;
      if (text.length > 14) text = text.substring(0, 12) + '...';
      ctx.fillText(text, radius - 20, 5);
      ctx.restore();
    }
  };

  const spinWheel = () => {
    if (isSpinningRef.current) return;
    if (gifts.length === 0) {
      showToast(I18N[lang].toastEmpty);
      return;
    }

    isSpinningRef.current = true;
    wheelContainerRef.current.classList.remove('is-idle');

    let windUpAngle = 0;
    const startWindUp = () => {
      if (windUpAngle > -20) {
        windUpAngle -= 2;
        angleRef.current -= 2;
        drawWheel();
        animationRef.current = requestAnimationFrame(startWindUp);
      } else {
        startRealSpin();
      }
    };

    const startRealSpin = () => {
      const winningIndex = Math.floor(Math.random() * gifts.length);
      const arcSize = 360 / gifts.length;
      
      const stopAngleBase = 270 - (winningIndex * arcSize + arcSize / 2);
      const randomOffset = (Math.random() * arcSize * 0.8) - (arcSize * 0.4); 
      const minSpins = 5;
      const finalRotation = (minSpins * 360) + stopAngleBase + randomOffset;

      const startTime = performance.now();
      const duration = 5000;
      const startAngle = angleRef.current;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        if (elapsed < duration) {
          const t = elapsed / duration;
          const ease = 1 - Math.pow(1 - t, 3);
          const currentTarget = startAngle + (finalRotation * ease);
          
          const diff = currentTarget - angleRef.current;
          if (diff > 0 && Math.floor(currentTarget / arcSize) > Math.floor(angleRef.current / arcSize)) playTick();

          angleRef.current = currentTarget;
          drawWheel();
          animationRef.current = requestAnimationFrame(animate);
        } else {
          angleRef.current = startAngle + finalRotation;
          angleRef.current %= 360; 
          drawWheel();
          isSpinningRef.current = false;
          handleWin(gifts[winningIndex]);
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    };
    startWindUp();
  };

  const handleWin = (gift) => {
    playWinSound();
    setResult(gift);
    const end = Date.now() + 1500;
    const colors = ['#D42426', '#165B33', '#F8B229'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  // --- ACTIONS ---
  const handleAddGift = async () => {
    if (!inputName.trim()) return;
    
    let newGift = null;
    try {
      if (editId) {
        const index = gifts.findIndex(g => g.id === editId);
        if (index !== -1) {
          newGift = {
            ...gifts[index],
            name: inputName,
            giver: inputGiver || 'Anonymous',
            fullImage: inputImage || gifts[index].fullImage 
          };
          setGifts(prev => prev.map(g => g.id === editId ? newGift : g));
          await saveGiftToDB(newGift);
          showToast(I18N[lang].toastUpdated);
          setEditId(null);
        }
      } else {
        newGift = {
          id: Date.now(),
          name: inputName,
          giver: inputGiver || 'Anonymous',
          fullImage: inputImage
        };
        setGifts(prev => [...prev, newGift]);
        await saveGiftToDB(newGift);
        showToast(I18N[lang].toastAdded);
      }
      
      setInputName(''); setInputGiver(''); setInputImage(null);
      const fileInput = document.getElementById('imgUpload');
      if (fileInput) fileInput.value = "";
    } catch (e) {
      showToast(I18N[lang].toastErrorStorage);
    }
  };

  const handleEdit = (gift) => {
    setEditId(gift.id);
    setInputName(gift.name);
    setInputGiver(gift.giver);
    setIsPanelOpen(true); 
  };

  const handleCancelEdit = () => {
    setEditId(null); setInputName(''); setInputGiver(''); setInputImage(null);
    const fileInput = document.getElementById('imgUpload');
    if (fileInput) fileInput.value = "";
  };

  const handleDuplicate = async (gift) => {
    try {
      const copy = { ...gift, id: Date.now() };
      setGifts(prev => [...prev, copy]);
      await saveGiftToDB(copy);
      showToast(I18N[lang].toastCopied);
    } catch(e) {
      showToast(I18N[lang].toastErrorStorage);
    }
  };

  const handleRemove = async (id) => {
    if (editId === id) handleCancelEdit();
    setGifts(prev => prev.filter(g => g.id !== id));
    await deleteGiftFromDB(id);
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) showToast(I18N[lang].toastFileTooBig);
      setInputImage(file);
    }
  };

  const handleBgUpload = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'desktop') {
        setBgImageDesktop(file);
      } else {
        setBgImageMobile(file);
      }
      setBgStyle(null); // disable gradient to show image
    }
  };

  // --- NEW FEATURES ---
  const handleShuffle = async () => {
    if (gifts.length < 2) return;
    const shuffled = [...gifts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setGifts(shuffled);
    showToast(I18N[lang].toastShuffled);
  };

  const handleGenerate27 = async () => {
    setIsLoading(true);
    await clearDB();
    const newGifts = [];
    
    VIETNAMESE_ALPHABET.forEach((letter, index) => {
      // 27 letters. 3 Givers. 9 gifts each.
      // 0-8: Giver 0; 9-17: Giver 1; 18-26: Giver 2
      const giverIndex = Math.floor(index / 9);
      const giverName = GIVERS_27[giverIndex] || "An";
      
      // AUTO ASSIGN GIF FROM PUBLIC FOLDER
      const gifPath = GIVER_GIF_MAP[giverName] || null;

      newGifts.push({
        id: Date.now() + index, 
        name: letter, // SIMPLIFIED NAME: Just "A", "B"...
        giver: giverName,
        fullImage: gifPath // Assign default GIF
      });
    });

    for (const g of newGifts) {
      await saveGiftToDB(g);
    }
    
    setGifts(newGifts);
    setIsLoading(false);
    showToast(I18N[lang].toastGenerated);
  };

  const confirmWin = async () => {
    if (result) {
      setGifts(prev => prev.filter(g => g.id !== result.id));
      await deleteGiftFromDB(result.id);
      setResult(null);
      wheelContainerRef.current.classList.add('is-idle');
    }
  };

  // --- PREVIEW HELPERS ---
  const previewSource = inputImage ? inputImage : (editId ? gifts.find(g => g.id === editId)?.fullImage : null);
  // Hooks for image URLs (safe for both file objects and string paths)
  const desktopBgUrl = useObjectUrl(bgImageDesktop);
  const mobileBgUrl = useObjectUrl(bgImageMobile);

  return (
    <div className={`h-screen flex flex-col overflow-hidden text-white font-mali relative`}
         style={{ background: bgStyle || '#000' }}>
      
      {/* BACKGROUND LOGIC FIX (FALLBACK) */}
      {!bgStyle && (
        <>
          {/* Desktop View */}
          <div className="hidden md:block absolute inset-0 z-0">
            <img 
              src={desktopBgUrl || mobileBgUrl} 
              className="w-full h-full object-cover opacity-80" 
              alt="bg-desktop" 
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden absolute inset-0 z-0">
            <img 
              src={mobileBgUrl || desktopBgUrl} 
              className="w-full h-full object-cover opacity-80" 
              alt="bg-mobile" 
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        </>
      )}

      <style>{`
        @font-face { font-family: 'Mali'; src: local('Mali'); }
        @font-face { font-family: 'ZCOOL KuaiLe'; src: local('ZCOOL KuaiLe'); }
        .font-mali { font-family: ${lang === 'cn' ? '"ZCOOL KuaiLe", cursive' : '"Mali", cursive'}; }
        .is-idle canvas { animation: idleSpin 60s linear infinite; }
        @keyframes idleSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        /* SNOWFALL KEYFRAMES */
        .snowflake { 
          position: absolute; 
          top: -20px; 
          color: white; 
          animation: fall linear forwards; 
          pointer-events: none;
          text-shadow: 0 0 3px rgba(0,0,0,0.5); /* Strong shadow for visibility */
        }
        @keyframes fall { 100% { transform: translateY(110vh); opacity: 0; } }
      `}</style>
      
      {/* SNOWFALL COMPONENT */}
      <SnowFall />

      <audio ref={audioRef} loop src={ASSET_CONFIG.defaultAudio} />

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-40 px-4 py-3 flex justify-between items-center">
        {/* Language Switcher - Fixed colors */}
        <div className="flex space-x-2 bg-white/90 backdrop-blur rounded-full p-1 shadow-sm text-gray-800">
          {['vi', 'en', 'cn'].map(l => (
            <button key={l} onClick={() => setLang(l)} 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-gray-200 ${lang === l ? 'bg-gray-200' : ''}`}>
              {l === 'vi' ? '🇻🇳' : l === 'en' ? '🇬🇧' : '🇨🇳'}
            </button>
          ))}
        </div>
        <div className="flex space-x-3">
          <button onClick={() => {
            setIsSoundOn(!isSoundOn);
            if (!isSoundOn) audioRef.current?.play().catch(() => {}); else audioRef.current?.pause();
          }} className={`w-10 h-10 shadow-md rounded-full flex items-center justify-center transition ${isSoundOn ? 'bg-white text-[#165B33]' : 'bg-gray-400 text-white'}`}>
            {isSoundOn ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
          
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-10 h-10 bg-white text-[#165B33] shadow-md rounded-full flex items-center justify-center transition hover:bg-gray-100">
            <Settings size={20} />
          </button>

          <button onClick={() => setIsPanelOpen(true)} className="w-10 h-10 bg-[#D42426] shadow-md rounded-full text-white hover:bg-red-700 flex items-center justify-center transition">
            <Gift size={20} />
          </button>
        </div>
      </header>

      {/* SETTINGS MENU (BACKGROUND) */}
      {isSettingsOpen && (
        <div className="fixed top-16 right-4 z-50 bg-white rounded-xl shadow-xl p-4 w-64 animate-popIn text-[#2C3E50]">
          <h3 className="font-bold mb-3 border-b pb-2 flex items-center gap-2">
            <Settings size={16} /> {I18N[lang].settings}
          </h3>
          
          <div className="space-y-4">
            {/* Color Presets */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{I18N[lang].bgLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {BG_PRESETS.map((bg, idx) => (
                  <button key={idx} 
                    onClick={() => { setBgStyle(bg.value); setBgImageDesktop(null); setBgImageMobile(null); }}
                    className="h-10 rounded-lg border-2 border-transparent hover:border-[#D42426] transition"
                    style={{ background: bg.value }}
                    title={bg.name}
                  />
                ))}
              </div>
            </div>
            
            {/* Desktop Upload */}
            <div>
              <input type="file" accept="image/*" id="bgUploadDesktop" className="hidden" onChange={(e) => handleBgUpload(e, 'desktop')} />
              <label htmlFor="bgUploadDesktop" className="flex items-center justify-center gap-2 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm font-bold transition border border-gray-200">
                <Monitor size={16} className="text-blue-600" /> {I18N[lang].uploadBgDesktop}
              </label>
            </div>

            {/* Mobile Upload */}
            <div>
              <input type="file" accept="image/*" id="bgUploadMobile" className="hidden" onChange={(e) => handleBgUpload(e, 'mobile')} />
              <label htmlFor="bgUploadMobile" className="flex items-center justify-center gap-2 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm font-bold transition border border-gray-200">
                <Smartphone size={16} className="text-purple-600" /> {I18N[lang].uploadBgMobile}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
        <div className="relative w-full max-w-[400px] md:max-w-[600px] aspect-square flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <Loader className="animate-spin text-[#F8B229] mb-2" size={48} />
              <p>Loading Gifts...</p>
            </div>
          ) : (
            <>
              <div ref={wheelContainerRef} className="w-full h-full is-idle rounded-full border-8 border-white shadow-2xl relative transition-transform">
                <canvas ref={canvasRef} className="w-full h-full rounded-full" />
              </div>
              <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
                <ChevronDown size={60} color="#D42426" strokeWidth={3} />
              </div>
              <button onClick={spinWheel} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-28 md:h-28 bg-white rounded-full shadow-[0_0_20px_rgba(255,215,0,0.6)] border-4 border-[#F8B229] flex flex-col items-center justify-center z-30 active:scale-95 transition-transform group text-[#D42426]">
                <span className="font-black text-xl md:text-2xl">{I18N[lang].spin}</span>
              </button>
            </>
          )}
        </div>
      </main>

      {/* PANEL */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsPanelOpen(false)} />
          <div className="relative w-full md:w-[400px] bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-slideInRight text-[#2C3E50]">
            <div className="p-5 border-b flex justify-between items-center bg-[#FDFBF7]">
              <div>
                <h2 className="font-bold text-2xl text-[#165B33]">{I18N[lang].giftList}</h2>
                <p className="text-sm text-gray-500">{gifts.length} {I18N[lang].itemsLeft}</p>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b bg-white space-y-3">
              <div className="flex gap-2">
                <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
                  <input type="file" accept="image/*" className="hidden" id="imgUpload" onChange={handleImageUpload} />
                  <label htmlFor="imgUpload" className="w-full h-full rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 overflow-hidden relative">
                    {previewSource ? (
                      <SafeImage src={previewSource} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <>
                        <ImageIcon className="text-gray-400" size={24} />
                        <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">{I18N[lang].uploadLabel}</span>
                      </>
                    )}
                  </label>
                </div>
                <div className="flex-1 space-y-2">
                  <input value={inputName} onChange={e => setInputName(e.target.value)} className="w-full p-2 rounded-xl border bg-gray-50 text-sm focus:border-[#D42426] outline-none" placeholder={I18N[lang].placeholderGift} />
                  <input value={inputGiver} onChange={e => setInputGiver(e.target.value)} className="w-full p-2 rounded-xl border bg-gray-50 text-sm focus:border-[#165B33] outline-none" placeholder={I18N[lang].placeholderGiver} />
                </div>
              </div>
              <div className="flex gap-2">
                {editId && <button onClick={handleCancelEdit} className="w-1/3 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">{I18N[lang].cancel}</button>}
                <button onClick={handleAddGift} className="flex-1 py-2 bg-[#165B33] text-white font-bold rounded-xl hover:bg-green-800 shadow-lg flex items-center justify-center gap-2">
                  {editId ? <Edit size={16} /> : <Plus size={16} />}
                  {editId ? I18N[lang].update : I18N[lang].add}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f8f9fa]">
              {gifts.length === 0 ? <div className="text-center text-gray-400 mt-10 italic">{I18N[lang].emptyList}</div> : gifts.map((g, idx) => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                      {g.fullImage ? <SafeImage src={g.fullImage} className="w-full h-full object-cover" /> : <span className="text-[#D42426] font-bold">{idx+1}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{g.name}</div>
                      <div className="text-xs text-gray-500 truncate">{g.giver}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEdit(g)} className="p-2 text-gray-400 hover:text-green-600"><Edit size={16} /></button>
                    <button onClick={() => handleDuplicate(g)} className="p-2 text-gray-400 hover:text-blue-500"><Copy size={16} /></button>
                    <button onClick={() => handleRemove(g.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* FOOTER TOOLS */}
            <div className="p-4 border-t bg-gray-50 grid grid-cols-2 gap-3">
              <button onClick={handleShuffle} className="py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-bold">
                <Shuffle size={16} className="text-[#165B33]" /> {I18N[lang].shuffle}
              </button>
              <button onClick={handleGenerate27} className="py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-bold">
                <Wand2 size={16} className="text-[#D42426]" /> {I18N[lang].gen27}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-popIn text-[#2C3E50]">
            <div className="text-center pt-8 pb-4">
              <h2 className="font-black text-3xl md:text-4xl text-[#D42426] tracking-wide drop-shadow-sm">{I18N[lang].congrats}</h2>
            </div>
            <div className="relative w-full h-[300px] bg-[#FDFBF7] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-gradient-to-b from-[#F8B229]/20 to-transparent pointer-events-none" />
              {result.fullImage ? (
                <SafeImage src={result.fullImage} className="w-full h-full object-contain drop-shadow-xl z-10 animate-bounce-subtle" />
              ) : <Gift size={120} className="text-gray-200 animate-bounce" />}
            </div>
            <div className="px-6 py-6 text-center bg-white relative z-20">
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">FROM: {result.giver}</p>
              <h3 className="font-black text-2xl text-[#165B33] leading-tight mb-6">{result.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setResult(null); wheelContainerRef.current.classList.add('is-idle'); }} className="py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">{I18N[lang].closeKeep}</button>
                <button onClick={confirmWin} className="py-3 px-4 rounded-xl font-bold text-white bg-[#D42426] hover:bg-red-700 shadow-lg">{I18N[lang].confirmRemove}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 z-50 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <span className="font-bold">{toast.msg}</span>
      </div>
    </div>
  );
}