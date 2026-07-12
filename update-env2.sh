npx vercel env rm R2_ACCOUNT_ID production -y || true
npx vercel env rm R2_ACCOUNT_ID preview -y || true
npx vercel env rm R2_ACCESS_KEY_ID production -y || true
npx vercel env rm R2_ACCESS_KEY_ID preview -y || true
npx vercel env rm R2_SECRET_ACCESS_KEY production -y || true
npx vercel env rm R2_SECRET_ACCESS_KEY preview -y || true
npx vercel env rm R2_BUCKET_NAME production -y || true
npx vercel env rm R2_BUCKET_NAME preview -y || true
npx vercel env rm R2_PUBLIC_URL production -y || true
npx vercel env rm R2_PUBLIC_URL preview -y || true

printf "%s" "08f436cbd009ed94fb468fab2be1517a" | npx vercel env add R2_ACCOUNT_ID production
printf "%s" "08f436cbd009ed94fb468fab2be1517a" | npx vercel env add R2_ACCOUNT_ID preview
printf "%s" "cd41356fff2e5526cd99eba33db999d4" | npx vercel env add R2_ACCESS_KEY_ID production
printf "%s" "cd41356fff2e5526cd99eba33db999d4" | npx vercel env add R2_ACCESS_KEY_ID preview
printf "%s" "2f2c9bf6d2fd35a0b88238e71f9fbd2161fc3b7692a59b49b01facf5ac82c62d" | npx vercel env add R2_SECRET_ACCESS_KEY production
printf "%s" "2f2c9bf6d2fd35a0b88238e71f9fbd2161fc3b7692a59b49b01facf5ac82c62d" | npx vercel env add R2_SECRET_ACCESS_KEY preview
printf "%s" "xyl-storage" | npx vercel env add R2_BUCKET_NAME production
printf "%s" "xyl-storage" | npx vercel env add R2_BUCKET_NAME preview
printf "%s" "https://xyl-images.fragrant-disk-47c5.workers.dev" | npx vercel env add R2_PUBLIC_URL production
printf "%s" "https://xyl-images.fragrant-disk-47c5.workers.dev" | npx vercel env add R2_PUBLIC_URL preview
