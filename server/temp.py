import asyncio

async def coro_a():
   asyncio.sleep(1)
   print("I am coro_a(). Hi!")

async def coro_b():
   print("I am coro_b(). I sure hope no one hogs the event loop...")

async def main():
    task_b = asyncio.create_task(coro_b())
    num_repeats = 3
    for _ in range(num_repeats):
        print("test1")
        await coro_a()
    
    print("test2")
    await task_b

asyncio.run(main())