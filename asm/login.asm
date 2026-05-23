.model small
.stack 100h

.data

file db "user.txt",0

u db ?
p db ?

inputu db ?
inputp db ?

.code
main:

mov ax,@data
mov ds,ax


; open file

mov ah,3Dh
lea dx,file
mov al,0

int 21h
mov bx,ax


; read

mov ah,3Fh
lea dx,u
mov cx,1
int 21h

mov ah,3Fh
lea dx,p
mov cx,1
int 21h


; user input

mov ah,1
int 21h
mov inputu,al


mov ah,1
int 21h
mov inputp,al


cmp inputu,u
jne wrong

cmp inputp,p
jne wrong


mov dl,'Y'
mov ah,2
int 21h

jmp endp


wrong:

mov dl,'N'
mov ah,2
int 21h


endp:

mov ah,4ch
int 21h

end main
