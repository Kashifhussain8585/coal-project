.model small
.stack 100h

.data

file db "user.txt",0
user db ?
pass db ?
handle dw ?

.code
main:

mov ax,@data
mov ds,ax

; create file

mov ah,3Ch
lea dx,file
mov cx,0
int 21h

mov handle,ax


; username

mov ah,1
int 21h

mov user,al


; password

mov ah,1
int 21h

mov pass,al


; save username

mov ah,40h
mov bx,handle
lea dx,user
mov cx,1
int 21h


; save password

mov ah,40h
mov bx,handle
lea dx,pass
mov cx,1
int 21h


mov ah,4ch
int 21h

end main
