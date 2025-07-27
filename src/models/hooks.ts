import { CallbackError, Document, Query } from 'mongoose'

type ExtendedCallbackError = CallbackError & {
  status?: number
}

export const handleSaveError = (
    error: ExtendedCallbackError,
    doc: Document,
    next: (err?: CallbackError) => void
  ): void => {
    const { code, name } = error as any
    const status = (name === 'MongoServerError' && code === 11000) ? 409 : 400
    error.status = status
    next(error)
  }
  
  export function preUpdate(this: Query<any, any>, next: () => void): void {
    this.setOptions({ new: true, runValidators: true })
    next()
  }