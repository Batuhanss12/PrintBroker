import { motion } from "framer-motion";

// Printer Animation Loader
export function PrinterLoader({ size = 80, color = "#3B82F6" }: { size?: number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Printer Body */}
        <motion.div
          className="absolute inset-0 rounded-lg border-4"
          style={{ 
            borderColor: color,
            backgroundColor: `${color}10`
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Paper Tray */}
        <motion.div
          className="absolute bottom-0 left-1/2 w-3/4 h-2 rounded-sm"
          style={{ 
            backgroundColor: color,
            x: "-50%"
          }}
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Print Head */}
        <motion.div
          className="absolute top-1/3 w-full h-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            x: [-size/4, size/4, -size/4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Paper Coming Out */}
        <motion.div
          className="absolute -right-2 top-1/2 w-6 h-8 bg-white border-2 rounded-sm"
          style={{ borderColor: color }}
          initial={{ x: -30, opacity: 0 }}
          animate={{
            x: [0, 10, 0],
            opacity: [0, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <motion.p
        className="text-sm font-medium"
        style={{ color }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Baskı Hazırlanıyor...
      </motion.p>
    </div>
  );
}

// Rolling Paper Loader
export function RollingPaperLoader({ size = 80, color = "#10B981" }: { size?: number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Paper Roll */}
        <motion.div
          className="absolute left-0 top-1/2 w-8 h-8 rounded-full border-4"
          style={{ 
            borderColor: color,
            backgroundColor: `${color}20`,
            y: "-50%"
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Unrolling Paper */}
        <motion.div
          className="absolute left-8 top-1/2 h-1 rounded-full"
          style={{ 
            backgroundColor: color,
            y: "-50%"
          }}
          animate={{
            width: [0, size - 40, size - 40, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.4, 0.8, 1]
          }}
        />
        
        {/* Print Dots */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: color,
              left: 20 + i * 12,
              top: "45%"
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <motion.p
        className="text-sm font-medium"
        style={{ color }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Etiket Basılıyor...
      </motion.p>
    </div>
  );
}

// Ink Droplets Loader
export function InkDropletsLoader({ size = 80, colors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B"] }: { size?: number; colors?: string[] }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* CMYK Droplets */}
        {colors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-6 rounded-full"
            style={{
              backgroundColor: color,
              left: `${20 + i * 15}%`,
              top: "20%",
              clipPath: "ellipse(50% 60% at 50% 40%)"
            }}
            animate={{
              y: [0, size * 0.6, size * 0.6, 0],
              opacity: [1, 1, 0.3, 1],
              scale: [1, 0.8, 1.2, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Paper Base */}
        <motion.div
          className="absolute bottom-2 left-1/2 w-3/4 h-8 bg-white border-2 border-gray-300 rounded-sm"
          style={{ x: "-50%" }}
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Color Mixing Effect */}
        <motion.div
          className="absolute bottom-4 left-1/2 w-1/2 h-4 rounded-sm"
          style={{ 
            x: "-50%",
            background: `linear-gradient(90deg, ${colors.join(", ")})`
          }}
          animate={{
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <motion.p
        className="text-sm font-medium text-gray-700"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Renkler Karışıyor...
      </motion.p>
    </div>
  );
}

// Stack of Papers Loader
export function StackedPapersLoader({ size = 80, color = "#8B5CF6" }: { size?: number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Paper Stack */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3/4 h-3 bg-white border border-gray-300 rounded-sm"
            style={{
              left: "12.5%",
              bottom: `${10 + i * 8}%`,
              zIndex: 5 - i
            }}
            animate={{
              x: [0, 10, -5, 0],
              rotate: [0, 2, -1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Flying Paper */}
        <motion.div
          className="absolute w-3/4 h-3 bg-white border-2 rounded-sm shadow-lg"
          style={{
            borderColor: color,
            left: "12.5%",
          }}
          animate={{
            y: [size * 0.6, -10, size * 0.6],
            x: [0, 20, 0],
            rotate: [0, 15, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Printer Top */}
        <motion.div
          className="absolute top-0 left-1/4 w-1/2 h-4 rounded-t-lg border-2"
          style={{ 
            borderColor: color,
            backgroundColor: `${color}20`
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <motion.p
        className="text-sm font-medium"
        style={{ color }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Sayfa Yükleniyor...
      </motion.p>
    </div>
  );
}

// Digital Print Dots Loader
export function DigitalPrintLoader({ size = 80, color = "#EC4899" }: { size?: number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Print Grid */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-2">
          {[...Array(64)].map((_, i) => (
            <motion.div
              key={i}
              className="w-full h-full rounded-sm"
              style={{ backgroundColor: color }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: (i % 8) * 0.1 + Math.floor(i / 8) * 0.05,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Scanner Line */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            y: [0, size - 4, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      <motion.p
        className="text-sm font-medium"
        style={{ color }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Dijital Baskı...
      </motion.p>
    </div>
  );
}

// Compact Spinner for buttons and small spaces
export function PrintSpinner({ size = 20, color = "#3B82F6" }: { size?: number; color?: string }) {
  return (
    <motion.div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 border-2 border-transparent rounded-full"
        style={{ borderTopColor: color }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Inner Dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full"
        style={{ 
          backgroundColor: color,
          x: "-50%",
          y: "-50%"
        }}
        animate={{
          scale: [0.5, 1.5, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}

// Printing Progress Bar
export function PrintingProgressBar({ 
  progress = 0, 
  label = "Baskı hazırlanıyor...", 
  color = "#3B82F6" 
}: { 
  progress?: number; 
  label?: string; 
  color?: string; 
}) {
  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        
        {/* Animated print head */}
        <motion.div
          className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg"
          animate={{
            left: `${Math.max(0, progress - 2)}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      
      <div className="mt-2 flex justify-center">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 h-1 mx-1 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}

// 3D Printer Layer Loader
export function LayerPrintingLoader({ size = 80, color = "#10B981" }: { size?: number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Print Platform */}
        <div 
          className="absolute bottom-2 left-1/2 w-3/4 h-2 bg-gray-300 rounded-sm"
          style={{ transform: "translateX(-50%)" }}
        />
        
        {/* Printing Layers */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 w-1/2 h-1 rounded-sm"
            style={{ 
              backgroundColor: color,
              bottom: `${16 + i * 6}px`,
              transform: "translateX(-50%)"
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: ["0%", "100%", "100%"],
              opacity: [0, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Print Nozzle */}
        <motion.div
          className="absolute w-2 h-4 rounded-b-full"
          style={{ 
            backgroundColor: color,
            left: "25%",
            top: "20%"
          }}
          animate={{
            x: [0, size/2, 0],
            y: [0, size/6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      <motion.p
        className="text-sm font-medium"
        style={{ color }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Katman Katman Basılıyor...
      </motion.p>
    </div>
  );
}

// Binding Machine Loader
export function BindingLoader({ size = 80, color = "#8B5CF6" }: { size?: number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Paper Stack */}
        <div className="absolute left-1/4 top-1/3 w-1/2 h-1/3 bg-white border-2 border-gray-300 rounded-sm" />
        
        {/* Spiral Binding */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: color,
              left: "15%",
              top: `${35 + i * 4}%`
            }}
            animate={{
              scale: [0, 1, 1],
              rotate: [0, 360, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Binding Machine */}
        <motion.div
          className="absolute right-1/4 top-1/4 w-1/4 h-1/2 rounded-lg border-2"
          style={{ borderColor: color }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <motion.p
        className="text-sm font-medium"
        style={{ color }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Ciltleme İşlemi...
      </motion.p>
    </div>
  );
}

// Random Loader Selector
export function RandomPrintingLoader({ size = 80 }: { size?: number }) {
  const loaders = [
    <PrinterLoader size={size} />,
    <RollingPaperLoader size={size} />,
    <InkDropletsLoader size={size} />,
    <StackedPapersLoader size={size} />,
    <DigitalPrintLoader size={size} />,
    <LayerPrintingLoader size={size} />,
    <BindingLoader size={size} />
  ];
  
  const randomLoader = loaders[Math.floor(Math.random() * loaders.length)];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      {randomLoader}
    </motion.div>
  );
}