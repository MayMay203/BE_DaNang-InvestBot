export class ResponseData<D> {
  data: D | D[];
  statusCode: number;
  message: string | null;
  constructor(data: D | D[], statusCode: number, message: string | null) {
    this.data = data;
    this.statusCode = statusCode;
    this.message = message;
    return this;
  }
}
