
#!/bin/bash

# Git config ayarları
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Değişiklikleri otomatik olarak commit ve push et
while true; do
  sleep 300  # 5 dakikada bir kontrol et
  
  if [ -n "$(git status --porcelain)" ]; then
    echo "Değişiklikler tespit edildi, commit ediliyor..."
    git add .
    git commit -m "Auto commit: $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
    echo "Değişiklikler push edildi!"
  else
    echo "Değişiklik yok."
  fi
done
