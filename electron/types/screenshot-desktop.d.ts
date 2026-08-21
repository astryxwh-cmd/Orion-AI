declare module 'screenshot-desktop' {
  interface ScreenshotOptions {
    filename?: string
    format?: 'png' | 'jpg' | 'jpeg'
    quality?: number
    screen?: number
    recursive?: boolean
  }

  function screenshotDesktop(options?: ScreenshotOptions): Promise<string>

  export default screenshotDesktop
}
