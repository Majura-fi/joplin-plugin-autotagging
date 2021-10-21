export class Logger {
  private debugEnabled = true;

  public Info(msg: any, ...extra: any[]): void {
    this.emit('info', msg, extra);
  }

  public Warn(msg: any, ...extra: any[]): void {
    this.emit('warn', msg, extra);
  }

  public Error(msg: any, ...extra: any[]): void {
    this.emit('error', msg, extra);
  }

  public enableDebug(val: boolean): void {
    this.debugEnabled = val;
    console.info('Debug enabled: ', val);
  }

  public isEnabled(): boolean {
    return this.debugEnabled;
  }

  private emit(msgType: 'debug'|'info'|'warn'|'error', msg: any, extra: any[]): void {
    /* 
      Don't emit console messages if 
      debug is off and message types are 'debug' or 'info'.
      Let warnings and errors through.
    */
    if (!this.debugEnabled && ['debug', 'info'].includes(msgType)) {
      return;
    }

    if (extra.length > 0) {
      console[msgType](msg, ...extra);
    } else {
      console[msgType](msg);
    }
  }
}

export const logger = new Logger();
