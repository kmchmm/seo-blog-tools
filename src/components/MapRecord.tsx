import { MapRecordProps } from '../types';

const isDev = import.meta.env.MODE === 'development';

export const MapRecord = (mapProps: MapRecordProps) => {
  return (
    <tr key={`${mapProps.title}_${mapProps.address}`}>
      <td>{mapProps.title}</td>
      <td>{mapProps.type}</td>
      <td className="capitalize">{mapProps.county}</td>
      <td>{mapProps.address}</td>

      <td>
        {mapProps.phone_number.trim().toLowerCase() !== 'no contact number' ? (
          <a
            href={`tel:${mapProps.phone_number}`}
            target="_blank"
            rel="noopener noreferrer">
            {mapProps.phone_number}
          </a>
        ) : (
          '-----'
        )}
      </td>
      <td>{mapProps.details}</td>
      <td>
        {mapProps.website.trim().toLowerCase() !== 'no links' ? (
          <a
            className="line-clamp-3"
            href={mapProps.website}
            target="_blank"
            rel="noopener noreferrer">
            {mapProps.website}
          </a>
        ) : (
          '-----'
        )}
      </td>
      {isDev && (
        <td>
          <button
            disabled={mapProps.loading}
            className={
              mapProps.loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }
            onClick={async () => {
              mapProps.deleteGMapRequest(mapProps.id);
            }}>
            DELETE {mapProps.id}
          </button>
        </td>
      )}
    </tr>
  );
};
