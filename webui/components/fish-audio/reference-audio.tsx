'use client'
import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"

const UseReferenceAudio = () => {
    const [useReferenceAudio, setUseReferenceAudio] = useState(false);

    return (
        <div>
            <p>adv</p>
            <Switch checked={useReferenceAudio} onCheckedChange={setUseReferenceAudio} />
            {/* <FormField
              control={form.control}
              name="marketing_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Marketing emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about new products, features, and more.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            /> */}
            {useReferenceAudio ? <div>Advanced Setting</div> : null}
        </div>
    )
}

export { UseReferenceAudio }