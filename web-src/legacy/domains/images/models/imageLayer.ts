export type ImageLayer = {
  Id: string;
  Created: number;
  CreatedBy: string;
  Tags: string[];
  Size: number;
  Comment: string;
};

export class ImageLayerViewModel implements ImageLayer {
  Id: ImageLayer['Id'];

  Created: ImageLayer['Created'];

  CreatedBy: ImageLayer['CreatedBy'];

  Size: ImageLayer['Size'];

  Comment: ImageLayer['Comment'];

  Tags: ImageLayer['Tags'];

  constructor(
    public Order: number,
    data: ImageLayer
  ) {
    this.Id = data.Id;
    this.Created = data.Created;
    this.CreatedBy = data.CreatedBy;
    this.Size = data.Size;
    this.Comment = data.Comment;
    this.Tags = data.Tags;
  }
}
