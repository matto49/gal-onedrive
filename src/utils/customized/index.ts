export const setElementWrapper = (fn: (value: string) => void) => {
  return (e: any) => {
    fn(e.target.value)
  }
}
