import { escape } from 'lodash';

export class TeamViewModel {
  Id: number;

  Name: string;

  Checked = false;

  constructor(data: { Id: number; Name: string }) {
    this.Id = data.Id;
    this.Name = escape(data.Name);
  }
}
