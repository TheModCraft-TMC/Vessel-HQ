import filesizeParser from 'filesize-parser';

class KubernetesResourceReservationHelper {
  static megaBytesValue(value: string | number) {
    return Math.floor(safeFilesizeParser(value) / 1000 / 1000);
  }
}

function safeFilesizeParser(value: string | number) {
  if (!value || Number.isNaN(value)) {
    return 0;
  }

  return filesizeParser(value);
}

export default KubernetesResourceReservationHelper;
