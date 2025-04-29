import { ChangeEvent, FC, useRef, useState } from 'react';
import piexif, { ExifIFD, TAGS } from 'piexifjs';
import clsx from 'clsx';
import { Button } from '../components/Button';

interface ICoordArray {
  0: [number, number];
  1: [number, number];
  2: [number, number];
}

const computeCoordinate = (rawCoords: ICoordArray) => {
  console.log('COORDS!!!')
  console.log(rawCoords)
  if (rawCoords) {
    return (rawCoords[0][0] / rawCoords[0][1]) + // degrees
    (rawCoords[1][0] / rawCoords[1][1] / 60) + // minutes
    (rawCoords[2][0] / rawCoords[2][1] / 3600) // seconds
  }
  return '';
}

const GeoTagger: FC = () => {
  const [exifName, setEXIFName ] = useState<string>('');
  const [exifDesc, setEXIFDesc ] = useState<string>('');
  const [exifLatitude, setEXIFLatitude ] = useState<string>('');
  const [exifLongitude, setEXIFLongitude ] = useState<string>('');
  const fileSelectRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    if (!target.files || !target.files.length) return;
    console.log(target.files);
    const file = target.files[0];

    // Encode the file using the FileReader API
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('DATA URL!!!')
      console.log(reader.result);
      // Logs data:<type>;base64,wL2dvYWwgbW9yZ...
      const dataURI = reader.result as string;
      const exifObj = piexif.load(dataURI);
      console.log(exifObj);
      
      if (exifObj) {
        setEXIFName(exifObj['0th'] ? exifObj['0th'][269] : '');
        setEXIFDesc(exifObj['0th'] ? exifObj['0th'][270] : '');
        const latitudeObj = exifObj['GPS'] && exifObj['GPS'][2];
        const latitude = String(computeCoordinate(latitudeObj));
        const longitudeObj = exifObj['GPS'] && exifObj['GPS'][4];
        const longitude = String(computeCoordinate(longitudeObj));
        setEXIFLatitude(latitude);
        setEXIFLongitude(longitude);
      }
    };
    reader.readAsDataURL(file);
  }

  const writeTags = () => {
    console.log('WRITING...')
    console.log(exifName, exifDesc, exifLatitude, exifLongitude)
    const fileSelect = fileSelectRef.current;
    if (!fileSelect || !fileSelect.files || !fileSelect.files.length) return;
    const file = fileSelect.files[0];

    // Encode the file using the FileReader API
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const dataURI = reader.result as string;
      const exifObj = piexif.load(dataURI);
      console.log(exifObj);

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
          console.log('INSERTED')
          console.log(inserted)
          const a = document.createElement('a');
          a.href = inserted;
          a.download = 'handle-exif.jpeg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(inserted);

        }
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Geo Tagger</h1>
      <input
        type="file"
        onChange={handleFileSelect}
        accept=".jpg,.jpeg"
        ref={fileSelectRef}
      />
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
      <div>Geotags
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
      <Button onClick={writeTags}>Write EXIF and Download</Button>
    </div>
  );
};

export default GeoTagger;
