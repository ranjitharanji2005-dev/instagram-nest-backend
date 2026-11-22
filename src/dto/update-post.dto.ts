import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePostDto {
    @IsString()
    @IsNotEmpty()
    caption!: string;

    @IsString()
    @IsNotEmpty()
    image!: string;
}