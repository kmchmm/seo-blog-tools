import { ChangeEvent, DragEvent, FC, useEffect, useRef, useState } from 'react';
import piexif from 'piexifjs';
import axios from 'axios';
import clsx from 'clsx';
import { Button } from '../components/Button';

import { FaUpload } from "react-icons/fa";

interface ICoordArray {
  0: [number, number];
  1: [number, number];
  2: [number, number];
}

const IS_DEV = import.meta.env.MODE === 'development';

const API_URL = IS_DEV
  ? import.meta.env.VITE_LOCAL_EXIF_API_URL
  : import.meta.env.VITE_PROD_EXIF_API_URL;

const ACCEPTED_FILES = '.jpg,.jpeg,.png,.webp';

const computeCoordinate = (rawCoords: ICoordArray) => {
  if (rawCoords) {
    return (rawCoords[0][0] / rawCoords[0][1]) + // degrees
    (rawCoords[1][0] / rawCoords[1][1] / 60) + // minutes
    (rawCoords[2][0] / rawCoords[2][1] / 3600) // seconds
  }
  return '';
}

const isAccepted = (filename: string) => {
  const extensionsArr = ACCEPTED_FILES.split(',');
  return extensionsArr.some(extension => filename.endsWith(extension))
}

const GeoTagger: FC = () => {
  const [exifName, setEXIFName ] = useState<string>('');
  const [exifDesc, setEXIFDesc ] = useState<string>('');
  const [exifLatitude, setEXIFLatitude ] = useState<string>('');
  const [exifLongitude, setEXIFLongitude ] = useState<string>('');
  const [file, setFile] = useState<File>();
  const fileSelectRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const clearAll = () => {
    setEXIFName('');
    setEXIFDesc('');
    setEXIFLatitude('');
    setEXIFLongitude('');
    setFile(undefined);
    if (fileSelectRef.current) {
      fileSelectRef.current.value = '';
    }
  }

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (!target.files || !target.files.length) return;
    if (!isAccepted(target.files[0].name)) return;
    setFile(target.files[0]);
  }

  const writeTags = () => {
    if (!file) return;

    // Encode the file using the FileReader API
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataURI = reader.result as string;
      const exifObj = piexif.load(dataURI);

      if (exifObj) {
        const zeroth = exifObj['0th'] || {};
        // set EXIF Document Name
        zeroth[269] = exifName;
        zeroth[270] = exifDesc;
        
        const gps = exifObj['GPS'] || {};
        gps[piexif.GPSIFD.GPSLatitudeRef] = Number(exifLatitude) < 0 ? 'S' : 'N';
        gps[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Number(exifLatitude));
        gps[piexif.GPSIFD.GPSLongitudeRef] = Number(exifLongitude) < 0 ? 'W' : 'E';
        gps[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Number(exifLongitude));

        exifObj['0th'] = zeroth;
        exifObj['GPS'] = gps;

        const exifbytes = piexif.dump(exifObj);
        if (reader) {
          const inserted = piexif.insert(exifbytes, (reader.result as string));
          const a = document.createElement('a');
          a.href = inserted;
          a.download = `${file.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(inserted);
        }
      }
    };
    reader.readAsDataURL(file);
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer?.files;

    if (droppedFiles && droppedFiles.length > 0) {
      const newFiles = Array.from(droppedFiles);
      if (newFiles && newFiles[0] && isAccepted(newFiles[0].name)) {
        setFile(newFiles[0]);
      }
    }
  };

  const uploadFile = async (file: File) => {

    try {
      const response = await axios.post(
        API_URL,
        {
          file: file
        },
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }          
        }
      );

      const data = response.data;
      setEXIFName(data.DocumentName);
      setEXIFDesc(data.ImageDescription);
      setEXIFLatitude(data.GPSLatitude)
      setEXIFLongitude(data.GPSLongitude)
      console.log('UPLOADED!!!')
      console.log(data);
    } catch (err) {
      console.error('Error during API call:', err);

    } finally {}
  }

  useEffect(() => {
    if (!file) {
      if (imgRef.current) imgRef.current.src = '';
      return;
    }
    uploadFile(file);

    // // Encode the file using the FileReader API
    // const reader = new FileReader();
    // reader.onloadend = () => {
    //   // Logs data:<type>;base64,wL2dvYWwgbW9yZ...
    //   const dataURI = reader.result as string;
    //   const exifObj = piexif.load(dataURI);
    //   if (imgRef.current) imgRef.current.src = dataURI;
      
    //   if (exifObj) {
    //     setEXIFName(exifObj['0th'] && exifObj['0th'][269] ? exifObj['0th'][269] : '');
    //     setEXIFDesc(exifObj['0th'] && exifObj['0th'][270] ? exifObj['0th'][270] : '');
    //     const latitudeObj = exifObj['GPS'] && exifObj['GPS'][2];
    //     const latitude = String(computeCoordinate(latitudeObj));
    //     const longitudeObj = exifObj['GPS'] && exifObj['GPS'][4];
    //     const longitude = String(computeCoordinate(longitudeObj));
    //     setEXIFLatitude(latitude);
    //     setEXIFLongitude(longitude);
    //   }
    // };
    // reader.readAsDataURL(file as File);    
  }, [file])

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Geo Tagger</h1>
      <div className='flex w-full mt-8 flex-1'>
        <section className='flex flex-col flex-1 items-center'>
          <label>EXIF Document Name</label>
          <input
            type="text"
            value={exifName}
            onChange={e => setEXIFName(e.target.value)}
            placeholder="Keywords and Tags"
          />
          <label>EXIF Image Description</label>
          <input
            type="text"
            value={exifDesc}
            onChange={e => setEXIFDesc(e.target.value)}
            placeholder="Description/Alternative Text"
          />
          <div className='flex flex-col items-center mt-3'>
            <label className='font-bold' >Geotags</label>
            <label>Latitude</label>
            <input
              type="text"
              value={exifLatitude}
              onChange={e => setEXIFLatitude(e.target.value)}
              placeholder="Latitude"
            />
            <label>Longitude</label>
            <input
              type="text"
              value={exifLongitude}
              onChange={e => setEXIFLongitude(e.target.value)}
              placeholder="Longitude"
            />
          </div>
        </section>
        <section className='w-1/2'>
          <Button
            className={clsx(
              'flex flex-col items-center justify-center h-15 w-full',
              'rounded-md border-dotted  cursor-pointer'
            )}
            onClick={() => {
              fileSelectRef.current?.click()
            }}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
          >
            <FaUpload/>
            Drop your JPG file here or click to browse
          </Button>
          <input
            type="file"
            onChange={handleFileSelect}
            accept={ACCEPTED_FILES}
            ref={fileSelectRef}
            hidden
          />
          <label className='block text-center p-2'>{file && file.name}</label>
          <img ref={imgRef} className='h-78 justify-self-center'/>
        </section>
      </div>
      <section className='flex flex-row gap-3 m-3'>
        <Button onClick={writeTags}>Write EXIF and Download</Button>
        <Button onClick={clearAll}>Clear All</Button>
      </section>
    </div>
  );
};

export default GeoTagger;
