export default function bufferize(str: string): Buffer {
  return Buffer.from(str, 'hex')
}
