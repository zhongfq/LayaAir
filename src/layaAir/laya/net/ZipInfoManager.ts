import { URL } from "./URL";

class ZipEntry {
    zipUrl: string;
    path: string;
}

export class ZipInfoManager {
    static _fileDict: Record<string, ZipEntry> = {};
    static _zipDict: Record<string, string[]> = {};

    static addZip(zipPath: string, files: string[]) {
        const baseZipDir = zipPath.replace(/.zip$/, "/");
        files.forEach((file) => {
            const filePath = URL.formatURL(baseZipDir + file);
            const zipUrl = URL.formatURL(zipPath);
            ZipInfoManager._fileDict[filePath] = {zipUrl:zipUrl, path: file};
        });
        ZipInfoManager._zipDict[URL.formatURL(zipPath)] = files;
    }

    static getZipFiles(url: string): string[] | undefined {
        return ZipInfoManager._zipDict[url];
    }

    static getEntryPath(url: string): string | undefined {
        return ZipInfoManager._fileDict[url]?.path;
    }

    static getZipUrl(url: string): string | undefined {
        return ZipInfoManager._fileDict[url]?.zipUrl;
    }
}