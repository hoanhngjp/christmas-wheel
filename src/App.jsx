import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Bell, BellOff, Gift, Plus, Trash2, Copy, Edit, 
  X, Image as ImageIcon, User, Music, ChevronDown, Loader, AlertTriangle,
  Shuffle, Wand2, Settings, Upload, Monitor, Smartphone, Star, Lock
} from 'lucide-react';

// --- CẤU HÌNH ASSETS CHO VERCEL ---
const ASSET_CONFIG = {
  defaultAudio: "background-music.mp3", 
  defaultBgDesktop: null, 
  defaultBgMobile: null   
};

// --- MAPPING GIF NGƯỜI TẶNG ---
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
const SECRET_COLOR = '#4B0082'; // Indigo/Purple for Secret Gift
// Bảng chữ cái mở rộng để đủ 30 phần quà thường
const VIETNAMESE_ALPHABET_EXTENDED = [
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'F',
  'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'Ô', 
  'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X'
]; 

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
    congratsSecret: "QUÀ ĐẶC BIỆT!",
    closeKeep: "Đóng & Giữ",
    confirmRemove: "Nhận & Xóa",
    toastEmpty: "Đã trao hết quà 🎄",
    toastAdded: "Đã thêm quà mới",
    toastUpdated: "Đã cập nhật quà",
    toastCopied: "Đã nhân bản quà",
    toastShuffled: "Đã trộn vị trí quà",
    toastGenerated: "Đã tạo bộ quà (Nghiệp, Hiếu, An)",
    toastCleared: "Đã xóa tất cả quà!",
    confirmClear: "Bạn có chắc chắn muốn xóa TẤT CẢ quà không?",
    toastErrorStorage: "Lỗi: File quá lớn hoặc ổ cứng đầy!",
    toastFileTooBig: "Cảnh báo: File > 100MB có thể gây lag!",
    toastRiggedOn: "🎯 Chế độ Secret đã bật",
    toastRiggedOff: "Đã tắt chế độ Secret",
    loadSample: "Nạp dữ liệu mẫu",
    placeholderGift: "Tên quà",
    placeholderGiver: "Người tặng",
    uploadLabel: "GIF/Ảnh (Max 100MB)",
    giverLabel: "Người tặng",
    shuffle: "Trộn quà",
    gen27: "Tạo bộ quà chuẩn",
    clearAll: "Xóa tất cả",
    settings: "Cài đặt",
    bgLabel: "Hình nền",
    uploadBgDesktop: "Ảnh nền PC",
    uploadBgMobile: "Ảnh nền ĐT",
    isSecret: "Là quà bí mật?"
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
    congratsSecret: "SECRET GIFT!",
    closeKeep: "Close & Keep",
    confirmRemove: "Claim & Remove",
    toastEmpty: "No gifts left 🎄",
    toastAdded: "Gift added",
    toastUpdated: "Gift updated",
    toastCopied: "Gift copied",
    toastShuffled: "Gifts shuffled",
    toastGenerated: "Generated standard gift set",
    toastCleared: "All gifts cleared!",
    confirmClear: "Are you sure you want to delete ALL gifts?",
    toastErrorStorage: "Storage Error: File too big!",
    toastFileTooBig: "Warning: File > 100MB may cause lag!",
    toastRiggedOn: "🎯 Secret mode ON",
    toastRiggedOff: "Secret mode OFF",
    loadSample: "Load Sample Data",
    placeholderGift: "Gift Name",
    placeholderGiver: "Giver Name",
    uploadLabel: "GIF/Img (Max 100MB)",
    giverLabel: "Giver",
    shuffle: "Shuffle",
    gen27: "Gen Standard Set",
    clearAll: "Delete All",
    settings: "Settings",
    bgLabel: "Background",
    uploadBgDesktop: "PC Background",
    uploadBgMobile: "Mobile Background",
    isSecret: "Is Secret Gift?"
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
    congratsSecret: "神秘礼物!",
    closeKeep: "关闭并保留",
    confirmRemove: "领取并移除",
    toastEmpty: "礼物已送完 🎄",
    toastAdded: "已添加礼物",
    toastUpdated: "礼物已更新",
    toastCopied: "礼物已复制",
    toastShuffled: "礼物已洗牌",
    toastGenerated: "已生成标准礼物集",
    toastCleared: "所有礼物已清空！",
    confirmClear: "你确定要删除所有礼物吗？",
    toastErrorStorage: "存储错误！",
    toastFileTooBig: "警告：文件 > 100MB 可能会导致卡顿！",
    toastRiggedOn: "🎯 神秘模式开启",
    toastRiggedOff: "神秘模式关闭",
    loadSample: "加载示例数据",
    placeholderGift: "礼物名称",
    placeholderGiver: "送礼人",
    uploadLabel: "图片",
    giverLabel: "送礼人",
    shuffle: "洗牌",
    gen27: "生成标准礼物",
    clearAll: "删除所有",
    settings: "设置",
    bgLabel: "背景",
    uploadBgDesktop: "电脑背景",
    uploadBgMobile: "手机背景",
    isSecret: "是神秘礼物吗？"
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

// --- SNOWFALL COMPONENT ---
const SnowFall = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createFlake = () => {
      const flake = document.createElement('div');
      flake.className = 'snowflake';
      flake.innerText = ['❄', '❅', '❆', '•'][Math.floor(Math.random() * 4)];
      
      const startLeft = Math.random() * 100;
      const size = Math.random() * 15 + 10; 
      const duration = Math.random() * 5 + 5; 
      const opacity = Math.random() * 0.5 + 0.3;

      flake.style.left = `${startLeft}vw`;
      flake.style.fontSize = `${size}px`;
      flake.style.opacity = opacity;
      flake.style.animationDuration = `${duration}s`;
      
      container.appendChild(flake);
      
      setTimeout(() => {
        if (flake.parentNode === container) {
          container.removeChild(flake);
        }
      }, duration * 1000);
    };

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
  
  // Secret / Rigging State
  const [isRigged, setIsRigged] = useState(false); 

  // Background State
  const [bgStyle, setBgStyle] = useState(
    (ASSET_CONFIG.defaultBgDesktop || ASSET_CONFIG.defaultBgMobile) ? null : BG_PRESETS[0].value
  );
  
  const [bgImageDesktop, setBgImageDesktop] = useState(ASSET_CONFIG.defaultBgDesktop); 
  const [bgImageMobile, setBgImageMobile] = useState(ASSET_CONFIG.defaultBgMobile);

  const [editId, setEditId] = useState(null);
  const [inputName, setInputName] = useState('');
  const [inputGiver, setInputGiver] = useState('');
  const [inputImage, setInputImage] = useState(null);
  const [inputIsSecret, setInputIsSecret] = useState(false);

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

  const toggleRigged = () => {
    const newState = !isRigged;
    setIsRigged(newState);
    showToast(newState ? I18N[lang].toastRiggedOn : I18N[lang].toastRiggedOff);
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
      const isSecret = gifts[i].isSecret; 
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arcSize);
      
      if (isSecret) {
        ctx.fillStyle = SECRET_COLOR;
      } else {
        ctx.fillStyle = COLORS[i % COLORS.length];
      }
      
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
      if (isSecret) text = "★ " + text;
      
      if (text.length > 14) text = text.substring(0, 12) + '...';
      ctx.fillText(text, radius - 20, 5);
      ctx.restore();
    }
  };

  // --- SPIN LOGIC (IMPROVED) ---
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
      let winningIndex = -1;
      
      // 1. Rigged Mode: Force Secret Gift
      if (isRigged) {
        const secretIndex = gifts.findIndex(g => g.isSecret);
        if (secretIndex !== -1) {
          winningIndex = secretIndex;
          setIsRigged(false); 
          console.log("Rigged spin activated!");
        }
      }

      // 2. Normal Mode: Filter out Secret Gifts (Exclude logic)
      if (winningIndex === -1) {
        const nonSecretIndices = gifts
          .map((g, i) => g.isSecret ? null : i)
          .filter(i => i !== null);
        
        if (nonSecretIndices.length > 0) {
          const randomPos = Math.floor(Math.random() * nonSecretIndices.length);
          winningIndex = nonSecretIndices[randomPos];
        } else {
          // Fallback if NO non-secret gifts exist at all
          winningIndex = Math.floor(Math.random() * gifts.length);
        }
      }

      const arcSize = 360 / gifts.length;
      const currentRotation = angleRef.current;
      
      const wedgeCenter = (winningIndex * arcSize) + (arcSize / 2);
      let baseTarget = 270 - wedgeCenter;
      
      const currentMod = currentRotation % 360;
      let distance = baseTarget - currentMod;
      while (distance < 0) distance += 360; 
      
      const minSpins = 8;
      const totalSpin = (minSpins * 360) + distance;
      
      const randomOffset = (Math.random() * arcSize * 0.8) - (arcSize * 0.4); 
      
      const finalTargetRotation = currentRotation + totalSpin + randomOffset;

      const startTime = performance.now();
      const duration = 8000; 
      const startAngle = currentRotation;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        if (elapsed < duration) {
          const t = elapsed / duration;
          const ease = 1 - Math.pow(1 - t, 4); 
          
          const currentTarget = startAngle + ((finalTargetRotation - startAngle) * ease);
          
          const prevAngle = angleRef.current;
          angleRef.current = currentTarget;
          
          if (elapsed < duration * 0.8) { 
             if (Math.floor(currentTarget / 20) > Math.floor(prevAngle / 20)) playTick();
          }

          drawWheel();
          animationRef.current = requestAnimationFrame(animate);
        } else {
          angleRef.current = finalTargetRotation; // Snap
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
    const colors = gift.isSecret ? ['#FFD700', '#FFFFFF', '#4B0082'] : ['#D42426', '#165B33', '#F8B229'];
    
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: colors }); 
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
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
            fullImage: inputImage || gifts[index].fullImage,
            isSecret: inputIsSecret
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
          fullImage: inputImage,
          isSecret: inputIsSecret
        };
        setGifts(prev => [...prev, newGift]);
        await saveGiftToDB(newGift);
        showToast(I18N[lang].toastAdded);
      }
      
      setInputName(''); setInputGiver(''); setInputImage(null); setInputIsSecret(false);
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
    setInputIsSecret(gift.isSecret || false);
    setIsPanelOpen(true); 
  };

  const handleCancelEdit = () => {
    setEditId(null); setInputName(''); setInputGiver(''); setInputImage(null); setInputIsSecret(false);
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

  const handleClearAll = async () => {
    if (window.confirm(I18N[lang].confirmClear)) {
      setIsLoading(true);
      await clearDB();
      setGifts([]);
      setIsLoading(false);
      showToast(I18N[lang].toastCleared);
    }
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
      setBgStyle(null); 
    }
  };

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

  // --- NEW GENERATE LOGIC ---
  // Nghiệp: 10 gifts
  // An: 9 gifts + 1 Xít rịt
  // Hiếu: 11 gifts
  const handleGenerate27 = async () => {
    setIsLoading(true);
    await clearDB();
    const newGifts = [];
    let currentLetterIndex = 0;

    // Helper to add gifts
    const addGifts = (giverName, count, isSecret = false, secretName = null, secretImg = null) => {
      for (let i = 0; i < count; i++) {
        let name = "";
        let gif = GIVER_GIF_MAP[giverName] || null;
        let finalSecret = isSecret;
        let finalImg = gif;

        if (isSecret && secretName && i === count - 1) { // Add secret at the end of the batch
           name = secretName;
           finalImg = secretImg || gif;
           finalSecret = true;
        } else {
           name = VIETNAMESE_ALPHABET_EXTENDED[currentLetterIndex] || `Quà ${currentLetterIndex + 1}`;
           currentLetterIndex++;
           finalSecret = false;
        }

        newGifts.push({
          id: Date.now() + newGifts.length,
          name: name,
          giver: giverName,
          fullImage: finalImg,
          isSecret: finalSecret
        });
      }
    };

    // 1. Nghiệp: 10 phần
    addGifts("Nghiệp", 10);

    // 2. An: 9 phần + 1 Xít rịt (Total 10)
    // We add 9 normal gifts first, then 1 special "Xít rịt"
    // Actually the request says "9 phần quà + 1 Xít rịt", implies 10 items for An.
    // Let's add 9 normal letters for An.
    addGifts("An", 9);
    // Add "Xít rịt" separately
    newGifts.push({
        id: Date.now() + newGifts.length,
        name: "Xít rịt",
        giver: "An",
        fullImage: "/images/secret-img.png", // Or An's GIF if secret img not available
        isSecret: true
    });

    // 3. Hiếu: 11 phần
    addGifts("Hiếu", 11);

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
  const desktopBgUrl = useObjectUrl(bgImageDesktop);
  const mobileBgUrl = useObjectUrl(bgImageMobile);

  return (
    <div className={`h-screen flex flex-col overflow-hidden text-white font-mali relative`}
         style={{ background: bgStyle || '#000' }}>
      
      <div 
        className="fixed bottom-0 left-0 w-16 h-16 z-[100] cursor-default"
        onClick={toggleRigged}
        title="Secret Trigger"
      />

      {!bgStyle && (
        <>
          <div className="hidden md:block absolute inset-0 z-0">
            <img src={desktopBgUrl || mobileBgUrl} className="w-full h-full object-cover opacity-80" alt="bg-desktop" />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
          <div className="block md:hidden absolute inset-0 z-0">
            <img src={mobileBgUrl || desktopBgUrl} className="w-full h-full object-cover opacity-80" alt="bg-mobile" />
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
        .snowflake { position: absolute; top: -20px; color: white; animation: fall linear forwards; pointer-events: none; text-shadow: 0 0 3px rgba(0,0,0,0.5); }
        @keyframes fall { 100% { transform: translateY(110vh); opacity: 0; } }
      `}</style>
      
      <SnowFall />
      <audio ref={audioRef} loop src={ASSET_CONFIG.defaultAudio} />

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-40 px-4 py-3 flex justify-between items-center">
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

      {/* SETTINGS MENU */}
      {isSettingsOpen && (
        <div className="fixed top-16 right-4 z-50 bg-white rounded-xl shadow-xl p-4 w-64 animate-popIn text-[#2C3E50]">
          <h3 className="font-bold mb-3 border-b pb-2 flex items-center gap-2">
            <Settings size={16} /> {I18N[lang].settings}
          </h3>
          <div className="space-y-4">
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
            <div>
              <input type="file" accept="image/*" id="bgUploadDesktop" className="hidden" onChange={(e) => handleBgUpload(e, 'desktop')} />
              <label htmlFor="bgUploadDesktop" className="flex items-center justify-center gap-2 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm font-bold transition border border-gray-200">
                <Monitor size={16} className="text-blue-600" /> {I18N[lang].uploadBgDesktop}
              </label>
            </div>
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
                  
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={inputIsSecret} onChange={(e) => setInputIsSecret(e.target.checked)} className="w-4 h-4 accent-[#4B0082]" />
                    <span className={inputIsSecret ? "font-bold text-[#4B0082]" : ""}>{I18N[lang].isSecret}</span>
                    {inputIsSecret && <Star size={14} className="text-[#FFD700] fill-current" />}
                  </label>
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
                <div key={g.id} className={`flex items-center justify-between p-3 rounded-xl shadow-sm hover:shadow-md transition ${g.isSecret ? 'bg-purple-50 border border-purple-200' : 'bg-white'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                      {g.fullImage ? <SafeImage src={g.fullImage} className="w-full h-full object-cover" /> : <span className="text-[#D42426] font-bold">{idx+1}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate flex items-center gap-1">
                        {g.name}
                        {g.isSecret && <Star size={12} className="text-[#FFD700] fill-current" />}
                      </div>
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
            
            <div className="p-4 border-t bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleShuffle} className="py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-bold">
                  <Shuffle size={16} className="text-[#165B33]" /> {I18N[lang].shuffle}
                </button>
                <button onClick={handleGenerate27} className="py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-bold">
                  <Wand2 size={16} className="text-[#D42426]" /> {I18N[lang].gen27}
                </button>
              </div>
              <button onClick={handleClearAll} className="w-full py-2 bg-white border border-red-200 text-red-500 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2 text-sm font-bold transition">
                <Trash2 size={16} /> {I18N[lang].clearAll}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" />
          <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-popIn ${result.isSecret ? 'bg-slate-900 text-white border-4 border-[#FFD700]' : 'bg-white text-[#2C3E50]'}`}>
            <div className="text-center pt-8 pb-4 relative">
              {result.isSecret && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>}
              <h2 className={`font-black text-3xl md:text-4xl tracking-wide drop-shadow-sm ${result.isSecret ? 'text-[#FFD700]' : 'text-[#D42426]'}`}>
                {result.isSecret ? I18N[lang].congratsSecret : I18N[lang].congrats}
              </h2>
            </div>
            <div className={`relative w-full h-[300px] flex items-center justify-center p-6 ${result.isSecret ? 'bg-transparent' : 'bg-[#FDFBF7]'}`}>
              {!result.isSecret && <div className="absolute inset-0 bg-gradient-to-b from-[#F8B229]/20 to-transparent pointer-events-none" />}
              {result.isSecret && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 bg-[#FFD700] rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                </div>
              )}
              {result.fullImage ? (
                <SafeImage src={result.fullImage} className="w-full h-full object-contain drop-shadow-xl z-10 animate-bounce-subtle" />
              ) : <Gift size={120} className={result.isSecret ? "text-[#FFD700] animate-bounce" : "text-gray-200 animate-bounce"} />}
            </div>
            <div className={`px-6 py-6 text-center relative z-20 ${result.isSecret ? 'bg-slate-900' : 'bg-white'}`}>
              <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${result.isSecret ? 'text-gray-400' : 'text-gray-500'}`}>FROM: {result.giver}</p>
              <h3 className={`font-black text-2xl leading-tight mb-6 ${result.isSecret ? 'text-white' : 'text-[#165B33]'}`}>{result.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setResult(null); wheelContainerRef.current.classList.add('is-idle'); }} className={`py-3 px-4 rounded-xl font-bold transition ${result.isSecret ? 'bg-slate-800 text-gray-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{I18N[lang].closeKeep}</button>
                <button onClick={confirmWin} className={`py-3 px-4 rounded-xl font-bold text-white shadow-lg ${result.isSecret ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:scale-105' : 'bg-[#D42426] hover:bg-red-700'}`}>{I18N[lang].confirmRemove}</button>
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