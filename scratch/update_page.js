import fs from 'fs';

const filePath = 'app/page.tsx';
const content = `import { redirect } from 'next/navigation'

export default function HomePage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  // Handle LIFF path redirection
  if (searchParams?.path) {
    const targetPath = Array.isArray(searchParams.path) ? searchParams.path[0] : searchParams.path;
    if (targetPath.startsWith('/')) {
      redirect(targetPath);
    }
  }
  
  redirect('/login')
}
`;

fs.writeFileSync(filePath, content);
console.log('Updated app/page.tsx to handle ?path= from LIFF');
