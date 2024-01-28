import fsPromise from "fs/promises";


export function yyyymmdd(): string {
  const x = new Date();
  const y = x.getFullYear().toString();
  let m = (x.getMonth() + 1).toString();
  let d = x.getDate().toString();

  (d.length == 1) && (d = '0' + d);
  (m.length == 1) && (m = '0' + m);

  return  y + m + d;
}

export function yyyymmdd_hh(): string {
   return yyyymmdd() + '_' + (new Date().getHours().toString().length == 1 ? '0' + new Date().getHours().toString() : new Date().getHours().toString());
}

export async function ensureFileExists(filePath: string): Promise<void> {
  try {
    await fsPromise.stat(filePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File does not exist, create it
      await fsPromise.writeFile(filePath, '', 'utf8');
    } else {
      // Re-throw other errors
      throw error;
    }
  }
}

export async function ensureIsDirectory(basePath: string) {
  try {
    const stats = await fsPromise.stat(basePath);
    if (!stats.isDirectory()) {
      throw new Error(`The path "${basePath}" is not a directory.`);
    }
  } catch (error : any) {
    if (error.code === 'ENOENT') {
      await fsPromise.mkdir(basePath, { recursive: true })
      console.log(`The directory "${basePath}" was created`);
    } else {
      throw error;
    }
  }
}